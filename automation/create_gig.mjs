// create_gig.mjs — publish Fiverr Gig 1 (B2B lead gen) end-to-end via CDP.
//
// Wizard tabs are reachable by URL:  ?wizard=1&tab=pricing | description |
// requirements | gallery | publish
//
// Pricing table rows (3 columns: Basic / Standard / Premium):
//   Name your package (textarea 35) | Describe the details of your offering
//   (textarea 100) | DELIVERY TIME (dropdown) | Revisions (dropdown) |
//   Price (number input)
//
// Live-form gotchas:
//  - gig title is a <textarea maxlength=80>; shown title is "I will " + value
//  - category / subcategory are readonly "orca-combo-box" widgets:
//    click the control, then ArrowDown + Enter
//  - the Gig metadata panel only appears AFTER the category is committed ->
//    click "Save" once, fill the metadata, click "Save" again
//  - search tags are a chips input: type a tag then press Enter
//  - the draft is NOT kept across page reloads -> one continuous run
//
// Usage: node create_gig.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { Tab, fiverrTab } from "./cdp.mjs";

const BASE = "C:/Users/abder/freelance-pack";
const GIG = JSON.parse(readFileSync("./gig1.json", "utf8"));
const SLUG = "build-verified-b2b-lead-lists-for-morocco-mena-and-africa";
const EDIT = `https://www.fiverr.com/users/allaouiabder/manage_gigs/${SLUG}/edit`;
const url = (t) => `${EDIT}?wizard=${(t === "general" || t === "pricing") ? 1 : 2}&tab=${t}`;

function ensureCdp() {
  try {
    const r = execFileSync("powershell", ["-ExecutionPolicy", "Bypass", "-File", "./ensure_opera_cdp.ps1"],
      { encoding: "utf8", timeout: 150000 });
    console.log("[cdp]", r.trim().split("\n").pop());
  } catch (e) { console.log("[cdp] failed:", String(e).slice(0, 120)); }
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------- form helpers
const setVal = (tab, sel, val) => tab.eval((s, v) => {
  const el = document.querySelector(s);
  if (!el) return "NOT FOUND " + s;
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return "ok";
}, sel, val);

const setAll = (tab, kind, matcher, values) => tab.eval((k, m, vals) => {
  const els = [...document.querySelectorAll(k)].filter(e => {
    if (e.offsetParent === null) return false;
    const ctx = (e.placeholder || "") + "|" + ((e.closest("label")?.innerText) || "");
    return new RegExp(m, "i").test(ctx);
  });
  if (els.length < vals.length) return "only " + els.length + " matches for " + m;
  els.forEach((el, i) => {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, vals[i]);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  return "filled " + vals.length;
}, kind, matcher, values);

const errs = (tab) => tab.eval(() => {
  const out = [];
  for (const e of document.querySelectorAll("*")) {
    if (e.children.length) continue;
    const t = (e.textContent || "").trim();
    const c = (e.className || "").toString();
    if (t && t.length < 90 && /error|missing|required|invalid|at least|must/i.test(c)) out.push(t);
  }
  return [...new Set(out)].slice(0, 8);
});

// the delivery-time dropdowns are the div.c3f47d7 whose text is "Delivery Time";
// after a pick that text changes, so match on the row that still has 3 widgets
async function pickDelivery(tab, col, wanted) {
  const openedList = await tab.eval((c) => {
    const els = [...document.querySelectorAll("div.c3f47d7")].filter(e => e.offsetParent !== null);
    const dts = els.filter(e => (e.innerText || "").trim().toLowerCase() === "delivery time");
    const pool = dts.length >= 3 ? dts : els.filter(e => {
      const row = e.closest("tr");
      return row && /delivery/i.test(row.innerText || "");
    });
    if (pool.length <= c) return "no delivery dropdown " + c + " (have " + pool.length + ")";
    const el = pool[c];
    let sc = el.parentElement;
    while (sc && !(sc.scrollHeight > sc.clientHeight + 80 && sc.clientHeight > 200)) sc = sc.parentElement;
    const box = sc || document.scrollingElement;
    const r0 = el.getBoundingClientRect();
    const target = (box.scrollTop || 0) + r0.top - (box.clientHeight || window.innerHeight) / 2 + r0.height / 2;
    box.scrollTop = Math.max(0, target);
    el.click();
    return "clicked";
  }, col);
  if (typeof openedList === "string" && openedList !== "clicked") return openedList;
  await wait(1400);
  return await pickFromOpenBox(tab, wanted);
}

async function pickFromOpenBox(tab, wanted) {
  const picked = await tab.eval((w) => {
    const want = Array.isArray(w) ? w : [w];
    const aside = [...document.querySelectorAll("aside.select-penta-design-box, aside.smaller-select-box-wrapper, aside")]
      .find(a => a.offsetParent !== null && (a.innerText || "").trim().length > 0);
    if (aside) {
      const sel = aside.querySelector("select");
      if (sel) {
        const opt = [...sel.options].find(o => want.some(t =>
          o.text.trim().toLowerCase() === t.toLowerCase() || o.text.trim().toLowerCase().startsWith(t.toLowerCase())));
        if (opt) {
          Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(sel, opt.value);
          sel.dispatchEvent(new Event("change", { bubbles: true }));
          return "select -> " + opt.text.trim();
        }
      }
    }
    const scope = aside || document;
    const opts = [...scope.querySelectorAll("button.table-select-option, li, [role=option], div.option, span.option, label")]
      .filter(e => e.offsetParent !== null && (e.innerText || "").trim() && (e.innerText || "").trim().length < 60);
    for (const t of want) {
      const hit = opts.find(e => e.getAttribute("value") === t)
               || opts.find(e => (e.innerText || "").trim().toLowerCase() === t.toLowerCase())
               || opts.find(e => (e.innerText || "").trim().toLowerCase().startsWith(t.toLowerCase()));
      if (!hit) continue;
      hit.click();
      return "picked " + hit.innerText.trim();
    }
    return "not found (" + want.join("/") + ") have: " + [...new Set(opts.map(e => e.innerText.trim()))].slice(0, 15).join(" | ");
  }, wanted);
  await wait(800);
  return picked;
}

// click a wizard step in the top nav (span.nav-crumb)
async function wizardTab(tab, name) {
  const r = await tab.eval((n) => {
    const el = [...document.querySelectorAll("span.nav-crumb, .nav-crumb")]
      .find(e => (e.innerText || "").trim().toLowerCase() === n.toLowerCase());
    if (!el) return "CRUMB NOT FOUND: " + n;
    el.scrollIntoView({ block: "center" });
    el.click();
    return "clicked " + n;
  }, name);
  await wait(3000);
  return r;
}

// pick an option from a dropdown that lives in a given table row
async function rowDropdown(tab, rowLabel, col, wanted) {
  // close any dropdown that is already open
  await tab.eval(() => {
    const open = [...document.querySelectorAll("aside")].find(a => a.offsetParent !== null && (a.innerText || "").trim().length);
    if (open) document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
  });
  await tab.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await wait(600);

  // open the dropdown: a JS click fires React's onClick exactly once
  const openedList = await tab.eval((rl, c) => {
    const rows = [...document.querySelectorAll("tr")];
    const matches = rows.filter(r => {
      const t = (r.innerText || "").trim();
      return t.split("\n")[0].trim().toLowerCase() === rl.toLowerCase()
          || new RegExp("^" + rl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(t);
    });
    // prefer a row that actually has the dropdown widgets
    const row = matches.find(r => r.querySelectorAll("div.c3f47d7").length > 0) || matches[0];
    if (!row) return "ROW NOT FOUND: " + rl;
    const dds = [...row.querySelectorAll("div.c3f47d7")].filter(e => e.offsetParent !== null);
    if (dds.length <= c) return "no dropdown " + c + " in " + rl + " (have " + dds.length + ")";
    const el = dds[c];
    // scroll the inner container so the element is really in the viewport
    let sc = el.parentElement;
    while (sc && !(sc.scrollHeight > sc.clientHeight + 80 && sc.clientHeight > 200)) sc = sc.parentElement;
    const box = sc || document.scrollingElement;
    const r0 = el.getBoundingClientRect();
    const target = (box.scrollTop || 0) + r0.top - (box.clientHeight || window.innerHeight) / 2 + r0.height / 2;
    box.scrollTop = Math.max(0, target);
    el.click();
    return "clicked";
  }, rowLabel, col);
  if (typeof openedList === "string" && openedList !== "clicked") return openedList;
  await wait(1400);

  const picked = await tab.eval((w) => {
    const want = Array.isArray(w) ? w : [w];
    const aside = [...document.querySelectorAll("aside.select-penta-design-box, aside.smaller-select-box-wrapper, aside")]
      .find(a => a.offsetParent !== null && (a.innerText || "").trim().length > 0);
    if (aside) {
      const sel = aside.querySelector("select");
      if (sel) {
        const opt = [...sel.options].find(o => want.some(t =>
          o.text.trim().toLowerCase() === t.toLowerCase() || o.text.trim().toLowerCase().startsWith(t.toLowerCase())));
        if (opt) {
          Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(sel, opt.value);
          sel.dispatchEvent(new Event("change", { bubbles: true }));
          return "select -> " + opt.text.trim();
        }
      }
    }
    const scope = aside || document;
    const opts = [...scope.querySelectorAll("button.table-select-option, li, [role=option], div.option, span.option, label")]
      .filter(e => e.offsetParent !== null && (e.innerText || "").trim() && (e.innerText || "").trim().length < 60);
    for (const t of want) {
      const hit = opts.find(e => e.getAttribute("value") === t)
               || opts.find(e => (e.innerText || "").trim().toLowerCase() === t.toLowerCase())
               || opts.find(e => (e.innerText || "").trim().toLowerCase().startsWith(t.toLowerCase()));
      if (!hit) continue;
      hit.click();
      return "picked " + hit.innerText.trim();
    }
    return "not found (" + want.join("/") + ") have: " + [...new Set(opts.map(e => e.innerText.trim()))].slice(0, 15).join(" | ");
  }, wanted);
  await wait(800);
  return picked;
}

// ---------------------------------------------------------------- main
(async () => {
  ensureCdp();
  const tab = await fiverrTab(url("general"), "manage_gigs");
  await wait(4000);

  // ============ STEP 1 : OVERVIEW (already filled in the draft) ============
  console.log("=== STEP 1 OVERVIEW ===");
  console.log("title   :", await setVal(tab, "textarea[maxlength='80']", GIG.titleAfterPrefix));
  const cat = await tab.eval(() => [...document.querySelectorAll(".orca-combo-box.category-selector__control")].map(c => (c.innerText || "").trim()));
  console.log("category:", JSON.stringify(cat));
  if (!/DATA/i.test(cat[0] || "")) {
    console.log("pick cat:", await tab.comboPick(".orca-combo-box.category-selector__control", GIG.category, 0));
    await wait(1000);
    console.log("pick sub:", await tab.comboPick(".orca-combo-box.category-selector__control", GIG.subcategory, 1));
    await wait(900);
    console.log("save    :", await tab.clickText("Save", "button"));
    await wait(3500);
  }
  // tags
  const tagSel = await tab.eval(() => {
    const lbl = [...document.querySelectorAll("div,span,label,p")].find(e =>
      e.children.length === 0 && (e.textContent || "").trim() === "Positive keywords");
    let box = lbl;
    for (let i = 0; i < 6 && box; i++) {
      const inp = box.querySelector("input,textarea");
      if (inp) { inp.setAttribute("data-tags", "1"); return "found"; }
      box = box.parentElement;
    }
    return null;
  });
  if (tagSel) console.log("tags    :", await tab.addTags("[data-tags='1']", GIG.tags));
  await wait(600);

  // metadata
  console.log("  [tech]", await tab.realClickText("Technology", "li,div,span,button,label", true));
  await wait(1100);
  for (const t of GIG.technology) console.log("   tech " + t + ":", await tab.checkByLabel(t));
  console.log("  [info]", await tab.realClickText("Information type", "li,div,span,button,label", true));
  await wait(1100);
  for (const t of (GIG.infoType || [])) console.log("   info " + t + ":", await tab.checkByLabel(t));
  console.log("  [techq]", await tab.realClickText("Technique", "li,div,span,button,label", true));
  await wait(1100);
  const techRect = await tab.eval(() => {
    const e = document.querySelector(".meta-single-select span > div") || document.querySelector(".meta-single-select");
    if (!e) return null;
    e.scrollIntoView({ block: "center" });
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (techRect) {
    await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: techRect.x, y: techRect.y, button: "left", clickCount: 1 });
    await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: techRect.x, y: techRect.y, button: "left", clickCount: 1 });
    await wait(1300);
    console.log("   " + await tab.eval((want) => {
      const w = want.toLowerCase();
      const aside = document.querySelector("aside.smaller-select-box-wrapper")
                || [...document.querySelectorAll("aside")].find(a => /AUTOMATED|MANUAL/i.test(a.innerText || ""));
      if (!aside) return "no box";
      const c = [...aside.querySelectorAll("*")].filter(e => (e.textContent || "").trim().toLowerCase() === w);
      if (!c.length) return "not found";
      c.sort((a, b) => b.querySelectorAll("*").length - a.querySelectorAll("*").length);
      c[0].click();
      return "technique = " + c[0].textContent.trim();
    }, GIG.technique));
    await wait(700);
  }
  console.log("save    :", await tab.clickText("Save", "button"));
  await wait(4000);
  console.log("errors  :", JSON.stringify(await errs(tab)));

  // ============ STEP 2 : PRICING ============
  console.log("\n=== STEP 2 PRICING ===");
  await tab.goto(url("pricing"));
  await wait(4000);
  console.log("names :", await setAll(tab, "textarea", "Name your package", GIG.packages.map(p => p.name)));
  console.log("descs :", await setAll(tab, "textarea", "Describe the details of your offering", GIG.packages.map(p => p.desc)));
  await wait(800);
  for (let c = 0; c < 3; c++) {
    console.log("  delivery[" + c + "]:", await pickDelivery(tab, c, GIG.packages[c].delivery));
  }
  for (let c = 0; c < 3; c++) {
    console.log("  revisions[" + c + "]:", await rowDropdown(tab, "Revisions", c, GIG.packages[c].revisions));
  }
  // prices: the 3 number inputs inside the Price row
  console.log("prices:", await tab.eval((vals) => {
    const rows = [...document.querySelectorAll("tr")];
    const row = rows.find(r => (r.innerText || "").trim().split("\n")[0].trim() === "Price");
    if (!row) return "no Price row";
    const nums = [...row.querySelectorAll("input[type=number]")];
    if (nums.length < 3) return "only " + nums.length + " price inputs";
    nums.slice(0, 3).forEach((el, i) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, vals[i]);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    return "prices set " + vals.join("/");
  }, GIG.packages.map(p => p.price)));
  // turn the optional add-ons off
  for (const add of ["Additional source scraped", "Additional pages scraped", "Extra fast delivery"]) {
    const st = await tab.labelState(add);
    if (st === "checked") console.log("  uncheck " + add + ":", await tab.checkByLabel(add, false));
  }
  await wait(800);
  console.log("save   :", await tab.clickText("Save", "button"));
  await wait(3500);
  console.log("errors :", JSON.stringify(await errs(tab)));
  try { await tab.shot(`${BASE}/tools/_gig1_pricing_done.png`); } catch {}

  // ============ STEP 3 : DESCRIPTION & FAQ ============
  console.log("\n=== STEP 3 DESCRIPTION & FAQ ===");
  await tab.goto(url("faq_description")); await wait(5000);
  await wait(4000);
  const d3 = await tab.eval(() => [...document.querySelectorAll("input,textarea")].filter(e => e.offsetParent !== null)
    .map((e, i) => `${i}: ${e.tagName}/${e.type} ph="${e.placeholder || ""}" max=${e.maxLength} ctx="${((e.closest("label")?.innerText) || (e.parentElement?.parentElement?.innerText || "").split("\n")[0] || "").trim().slice(0, 34)}"`));
  console.log(d3.join("\n"));
  console.log("desc  :", await setAll(tab, "textarea", "description|about|gig", [GIG.description]));
  await wait(600);
  // FAQ: question + answer pairs
  const faqInfo = await tab.eval(() => {
    const tas = [...document.querySelectorAll("textarea")].filter(e => e.offsetParent !== null);
    return tas.map((t, i) => `${i}: max=${t.maxLength} ph="${t.placeholder || ""}"`);
  });
  console.log("faq areas:", JSON.stringify(faqInfo));
  console.log("faq    :", await tab.eval((pairs) => {
    const tas = [...document.querySelectorAll("textarea")].filter(e => e.offsetParent !== null);
    const big = tas.filter(t => t.maxLength > 200);
    const small = tas.filter(t => t.maxLength <= 200);
    let n = 0;
    for (const [q, a] of pairs) {
      const qt = small[n * 2], at = small[n * 2 + 1];
      if (!qt || !at) break;
      [[qt, q], [at, a]].forEach(([el, v]) => {
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(el, v);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
      n++;
    }
    return n + " faq pairs filled";
  }, GIG.faq));
  await wait(800);
  console.log("save   :", await tab.clickText("Save", "button"));
  await wait(3500);
  console.log("errors :", JSON.stringify(await errs(tab)));

  // ============ STEP 4 : REQUIREMENTS ============
  console.log("\n=== STEP 4 REQUIREMENTS ===");
  await tab.goto(url("requirements")); await wait(5000);
  await wait(4000);
  console.log("reqs   :", await tab.eval((qs) => {
    const tas = [...document.querySelectorAll("textarea")].filter(e => e.offsetParent !== null);
    let n = 0;
    for (const [q] of qs) {
      const t = tas[n];
      if (!t) break;
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(t, q);
      t.dispatchEvent(new Event("input", { bubbles: true }));
      t.dispatchEvent(new Event("change", { bubbles: true }));
      n++;
    }
    return n + " requirements filled (of " + tas.length + " areas)";
  }, GIG.requirements));
  await wait(600);
  console.log("save   :", await tab.clickText("Save", "button"));
  await wait(3000);

  // ============ STEP 5 : GALLERY ============
  console.log("\n=== STEP 5 GALLERY ===");
  await tab.goto(url("gallery")); await wait(5000);
  await wait(4000);
  const imgs = GIG.images.map(f => join(BASE, f));
  try {
    await tab.setFiles("input[type=file]", imgs);
    console.log("images :", imgs.length, "uploaded");
  } catch (e) { console.log("images : UPLOAD ERROR", e.message); }
  await wait(6000);
  console.log("save   :", await tab.clickText("Save", "button"));
  await wait(3000);

  // ============ STEP 6 : PUBLISH ============
  console.log("\n=== STEP 6 PUBLISH ===");
  await tab.goto(url("publish")); await wait(5000);
  await wait(4000);
  const pubBtns = await tab.eval(() => [...document.querySelectorAll("button,a")].filter(b => b.offsetParent !== null)
    .map(b => (b.innerText || "").trim()).filter(t => /publish/i.test(t)));
  console.log("publish buttons:", JSON.stringify([...new Set(pubBtns)]));
  console.log("click   :", await tab.clickText("Publish gig", "button,a"));
  await wait(6000);
  console.log("url     :", await tab.eval(() => location.href));
  console.log("text    :\n" + (await tab.eval(() => document.body.innerText)).slice(0, 700));
  try { await tab.shot(`${BASE}/tools/_gig1_published.png`); } catch {}
  process.exit(0);
})();
