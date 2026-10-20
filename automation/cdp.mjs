// cdp.mjs — minimal Chrome DevTools Protocol driver (Node 24, no deps)
import { writeFileSync } from "node:fs";

const PORT = process.env.CDP_PORT || "9444";

export async function listTargets() {
  const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  const t = await r.json();
  return t.filter(x => x.type === "page");
}

export async function pickTarget(match) {
  const t = await listTargets();
  const hit = t.find(x => typeof match === "string" ? x.url.includes(match) : match.test(x.url + " " + x.title));
  if (!hit) throw new Error("no target for " + match + "\n" + t.map(x => x.url).join("\n"));
  return hit;
}

export async function newTab(url = "about:blank") {
  const r = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  return await r.json();
}

// Fiverr-specific: find a tab that is actually signed in (the session may
// survive while a stale /login tab lingers in the tab strip).
export async function fiverrTab(url = "https://www.fiverr.com/users/allaouiabder/portfolio", mustContain = "") {
  const targets = (await listTargets()).filter(x => x.type === "page" && x.url.includes("fiverr"));
  const signedIn = async (t) => {
    if (/login|signup|auth/i.test(t.url)) return false;
    const tab = new Tab(t.webSocketDebuggerUrl, t);
    try {
      await tab._connect();
      const ok = await tab.eval(() => /Abderrahim A\.|allaouiabder/.test(document.body.innerText.slice(0, 4000)));
      return ok ? tab : null;
    } catch { return null; }
  };

  for (const t of targets) {
    const tab = await signedIn(t);
    if (!tab) continue;
    if (mustContain) {
      await tab.goto(url);
      await new Promise(r => setTimeout(r, 3000));
      const at = await tab.eval(() => location.href).catch(() => "");
      if (at.includes(mustContain)) return tab;
      continue;
    }
    return tab;
  }

  // fall back: open a fresh tab
  const info = await newTab(url);
  const tab = new Tab(info.webSocketDebuggerUrl, info);
  await tab._connect();
  await tab.goto(url);
  return tab;
}

export class Tab {
  constructor(wsUrl, info) { this.wsUrl = wsUrl; this.info = info; this.id = 0; this.pending = new Map(); this.events = []; }

  static async open(match) {
    let info;
    try {
      info = await pickTarget(match);
    } catch {
      const url = typeof match === "string" ? match : "https://www.fiverr.com/";
      info = await newTab(url);
    }
    const tab = new Tab(info.webSocketDebuggerUrl, info);
    await tab._connect();
    return tab;
  }

  async _connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => { this.ws.onopen = res; this.ws.onerror = rej; });
    this.ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { res, rej } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      } else if (m.method) {
        this.events.push(m);
        if (m.method === "Page.javascriptDialogOpening") {
          this.send("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
        }
      }
    };
    this.ws.onclose = () => { this.dead = true; };
    await this.send("Runtime.enable").catch(() => {});
    await this.send("Page.enable").catch(() => {});
    await this.send("DOM.enable").catch(() => {});
  }

  async send(method, params = {}, _retry = true) {
    if (this.dead && _retry) { await this._connect(); }
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      try { this.ws.send(JSON.stringify({ id, method, params })); }
      catch (e) { this.pending.delete(id); return rej(e); }
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        if (_retry) { this.send(method, params, false).then(res, rej); }
        else rej(new Error("timeout " + method));
      }, 20000);
    });
  }

  async eval(fn, ...args) {
    const expr = `(${fn.toString()})(${args.map(a => JSON.stringify(a)).join(",")})`;
    const r = await this.send("Runtime.evaluate", {
      expression: expr, awaitPromise: true, returnByValue: true, userGesture: true
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }

  async goto(url) {
    await this.send("Page.navigate", { url });
    await new Promise(r => setTimeout(r, 3500));
  }

  async shot(path, full = false) {
    const p = { format: "png" };
    if (full) p.captureBeyondViewport = true;
    const r = await this.send("Page.captureScreenshot", p);
    writeFileSync(path, Buffer.from(r.data, "base64"));
    return path;
  }

  // set files on an <input type=file> identified by a JS predicate string
  async setFiles(inputSelector, files) {
    // depth:0 -> shallow doc. Using depth:-1 on a heavy page (Fiverr) returns the
    // entire DOM tree and crashes the renderer.
    const doc = await this.send("DOM.getDocument", { depth: 0 });
    const q = await this.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: inputSelector });
    if (!q.nodeId) throw new Error("input not found: " + inputSelector);
    await this.send("DOM.setFileInputFiles", { files, nodeId: q.nodeId });
    return q.nodeId;
  }

  async text() { return this.eval(() => document.body.innerText); }

  async clickText(txt, tag = "*") {
    return this.eval((t, g) => {
      const els = [...document.querySelectorAll(g)];
      const el = els.find(e => (e.innerText || e.value || "").trim() === t) ||
                   els.find(e => (e.innerText || "").trim().startsWith(t));
      if (!el) return "NOT FOUND: " + t;
      el.scrollIntoView({ block: "center" });
      el.click();
      return "clicked: " + (el.innerText || el.tagName).slice(0, 40);
    }, txt, tag);
  }

  async fill(selector, value) {
    return this.eval((s, v) => {
      const el = document.querySelector(s);
      if (!el) return "NOT FOUND: " + s;
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
      setter.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return "filled " + s;
    }, selector, value);
  }

  async waitFor(fn, timeout = 15000, interval = 400) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      try { const v = await this.eval(fn); if (v) return v; } catch {}
      await new Promise(r => setTimeout(r, interval));
    }
    return null;
  }

  async escape() {
    for (const type of ["keyDown", "keyUp"]) {
      await this.send("Input.dispatchKeyEvent", { type, key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    }
    await new Promise(r => setTimeout(r, 400));
    return "escape";
  }

  // Fiverr's search-tag box is a chips input: type a tag, press Enter.
  async addTags(selector, tags) {
    const sel = await this.eval((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      el.scrollIntoView({ block: "center" });
      el.focus();
      el.click();
      return "focused";
    }, selector);
    if (!sel) return "tag input not found";
    // clear whatever is there
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", key: "a", code: "KeyA", modifiers: 2 });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", modifiers: 2 });
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace" });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace" });
    await new Promise(r => setTimeout(r, 400));

    const done = [];
    for (const t of tags) {
      await this.send("Input.insertText", { text: t });
      await new Promise(r => setTimeout(r, 350));
      await this.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
      await this.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
      await new Promise(r => setTimeout(r, 600));
      done.push(t);
    }
    return "typed " + done.join(" / ");
  }

  // scroll an element into the middle of ITS scrollable container and return
  // its viewport rect (Fiverr scrolls an inner div, not the window)
  async scrollToEl(selector, index = 0) {
    return this.eval((sel, ix) => {
      const els = [...document.querySelectorAll(sel)].filter(e => e.offsetParent !== null);
      const el = els[ix];
      if (!el) return null;
      let sc = el.parentElement;
      while (sc && !(sc.scrollHeight > sc.clientHeight + 80 && sc.clientHeight > 200)) sc = sc.parentElement;
      const box = sc || document.scrollingElement;
      const r0 = el.getBoundingClientRect();
      const target = (box.scrollTop || 0) + r0.top - (box.clientHeight || window.innerHeight) / 2 + r0.height / 2;
      box.scrollTop = Math.max(0, target);
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
    }, selector, index);
  }

  // click a checkbox by its visible label text
  async checkByLabel(text, wanted = true) {
    const r = await this.eval((t, w) => {
      const labels = [...document.querySelectorAll("label")];
      const lab = labels.find(l => (l.innerText || "").trim().split("\n")[0] === t)
               || labels.find(l => (l.innerText || "").trim().includes(t));
      if (!lab) return "LABEL NOT FOUND: " + t;
      const cb = lab.querySelector("input[type=checkbox], input[type=radio]");
      if (!cb) return "NO INPUT in label: " + t;
      if (cb.checked === w) return "already " + (w ? "checked" : "unchecked");
      cb.click();
      return (w ? "checked " : "unchecked ") + t;
    }, text, wanted);
    await new Promise(res => setTimeout(res, 500));
    return r;
  }

  // does a visible checkbox with this label exist / is it checked?
  async labelState(text) {
    return this.eval((t) => {
      const lab = [...document.querySelectorAll("label")]
        .find(l => (l.innerText || "").trim().split("\n")[0] === t);
      if (!lab) return "missing";
      const cb = lab.querySelector("input[type=checkbox], input[type=radio]");
      if (!cb) return "no-input";
      return cb.checked ? "checked" : "unchecked";
    }, text);
  }

  // Fiverr's category pickers are custom "orca-combo-box" widgets: a readonly
  // react-select with a readonly input, opened by a real mouse click, then
  // navigated with ArrowDown / Enter.
  async comboPick(controlSelector, targetName, index = 0) {
    const targets = Array.isArray(targetName) ? targetName : [targetName];

    const openMenu = async () => {
      const rect = await this.eval((sel, ix) => {
        const c = document.querySelectorAll(sel)[ix];
        if (!c) return null;
        c.scrollIntoView({ block: "center" });
        const r = c.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }, controlSelector, index);
      if (!rect) return false;
      for (let k = 0; k < 4; k++) {
        await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
        await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
        await new Promise(r => setTimeout(r, 1100));
        const isOpen = await this.eval((sel, ix) => {
          const c = document.querySelectorAll(sel)[ix];
          return !!(c && (c.className || "").includes("--menu-is-open"));
        }, controlSelector, index);
        if (isOpen) return true;
        await this.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
        await new Promise(r => setTimeout(r, 400));
      }
      return false;
    };

    if (!await openMenu()) return "could not open menu: " + controlSelector;

    const focused = () => this.eval(() => {
      const el = document.getElementById("aria-context");
      if (!el) return null;
      const m = (el.textContent || "").match(/option\s+(.+?)\s+focused/);
      return m ? m[1] : null;
    });

    for (let i = 0; i < 30; i++) {
      const f = await focused();
      if (f && targets.some(t => t.toLowerCase() === f.toLowerCase())) {
        await this.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
        await this.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
        await new Promise(r => setTimeout(r, 1400));
        return "picked " + f + " (step " + i + ")";
      }
      await this.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
      await this.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
      await new Promise(r => setTimeout(r, 300));
    }
    const last = await focused();
    return "NOT FOUND: " + targets.join("/") + " (last focused: " + last + ")";
  }

  // list the options currently in an open orca-combo-box menu
  async comboOptions() {
    return this.eval(() => {
      const el = [...document.querySelectorAll("div")].find(e => {
        const c = (e.className || "").toString();
        return c.includes("orca-combo-box-container");
      });
      if (!el) return [];
      const txt = el.innerText || "";
      return [...new Set(txt.split("\n").map(s => s.trim()).filter(s => s && !/focused|results available|press/i.test(s)))];
    });
  }

  // real mouse click on a leaf element whose text matches exactly.
  // Fiverr hides the real radio inputs (visibility:hidden) and paints a
  // sibling div instead; those painted cells are also lazily rendered, so we
  // scroll to the candidate first and re-measure before clicking.
  async realClickText(text, tag = "*", exact = true, scope = null) {
    const box = await this.eval((t, g, ex, sc) => {
      const root = sc ? document.querySelector(sc) : document;
      if (!root) return null;
      const find = () => [...root.querySelectorAll(g)].filter(e => {
        if (e.children.length) return false;
        const s = (e.textContent || "").trim();
        const hit = ex ? s === t : s.includes(t);
        if (!hit) return false;
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden";
      });
      let els = find();
      if (!els.length) {
        for (let i = 0; i < 12; i++) {
          window.scrollBy(0, 260);
          els = find();
          if (els.length) break;
        }
      }
      const el = els[0];
      if (!el) return null;
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
    }, text, tag, exact, scope);
    if (!box) return "VISIBLE TEXT NOT FOUND: " + text;
    if (box.w === 0 || box.h === 0) return "ZERO SIZE: " + text;
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x, y: box.y });
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 });
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 });
    return "clicked '" + text + "'";
  }

  // real mouse click at the element's centre (like a human would)
  async realClick(selector, nth = 0) {
    const box = await this.eval((s, i) => {
      const els = [...document.querySelectorAll(s)];
      const el = els[i];
      if (!el) return null;
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    }, selector, nth);
    if (!box) return "NOT FOUND " + selector;
    if (box.w === 0 || box.h === 0) return "ZERO SIZE " + selector;
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x, y: box.y });
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 });
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 });
    return "real click at " + Math.round(box.x) + "," + Math.round(box.y);
  }

  // real click on a radio by its value
  async realClickRadio(value) {
    const box = await this.eval((v) => {
      const r = [...document.querySelectorAll("input[type=radio]")].find(x => x.value === v);
      if (!r) return null;
      const lab = r.closest("label") || r.parentElement;
      lab.scrollIntoView({ block: "center" });
      const b = lab.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height };
    }, value);
    if (!box) return "NOT FOUND radio " + value;
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x, y: box.y });
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x, y: box.y, button: "left", clickCount: 1 });
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x, y: box.y, button: "left", clickCount: 1 });
    return "real click radio " + value;
  }

  // real keystrokes so React's onChange fires
  async typeText(selector, text) {
    await this.eval((s) => {
      const el = document.querySelector(s);
      if (el) { el.scrollIntoView({ block: "center" }); el.focus(); el.click(); }
    }, selector);
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", key: "a", code: "KeyA", modifiers: 2 });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", modifiers: 2 });
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace" });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace" });
    for (const ch of text) {
      await this.send("Input.insertText", { text: ch });
      await new Promise(r => setTimeout(r, 90));
    }
    return this.eval((s) => document.querySelector(s)?.value, selector);
  }
}
