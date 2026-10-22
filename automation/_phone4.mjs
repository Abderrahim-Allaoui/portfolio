// _phone4.mjs — open a Fiverr verification sub-task by clicking the small radio circle
// nearest to its label. Works for all 4 sub-tasks.
import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

export async function openSubTask(tab, label) {
  // 1) find the label rect
  const lab = await tab.eval((l) => {
    const p = [...document.querySelectorAll("p")].find(e => (e.textContent || "").trim() === l);
    if (!p) return null;
    const r = p.getBoundingClientRect();
    return { x: r.x, y: r.y + r.height / 2, w: r.width, h: r.height };
  }, label);
  if (!lab) return "LABEL NOT FOUND: " + label;

  // 2) find the small circle closest to it (on its left)
  const circ = await tab.eval((l) => {
    const p = [...document.querySelectorAll("p")].find(e => (e.textContent || "").trim() === l);
    if (!p) return null;
    const lr = p.getBoundingClientRect();
    const cy = lr.top + lr.height / 2;
    const cands = [...document.querySelectorAll("div._1rtxvgq1j")].map(c => {
      const r = c.getBoundingClientRect();
      return { c, r, x: r.x, y: r.top + r.height / 2, w: r.width, h: r.height };
    }).filter(o => o.w >= 10 && o.w <= 28 && o.h >= 10 && o.h <= 28 && o.x <= lr.x + 5)
              .sort((a, b) => Math.abs(a.y - cy) - Math.abs(b.y - cy));
    if (!cands.length) return null;
    const c = cands[0];
    c.c.scrollIntoView({ block: "center" });
    return { x: c.x + c.w / 2, y: c.y + c.h / 2 };
  }, label);
  if (!circ) return "CIRCLE NOT FOUND: " + label;

  await wait(1000);
  const r2 = await tab.eval((l) => {
    const p = [...document.querySelectorAll("p")].find(e => (e.textContent || "").trim() === l);
    const lr = p.getBoundingClientRect();
    const cy = lr.top + lr.height / 2;
    const cands = [...document.querySelectorAll("div._1rtxvgq1j")].map(c => {
      const r = c.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    }).filter(o => o.w >= 10 && o.w <= 28 && o.h >= 10 && o.h <= 28 && o.x <= lr.x + 5)
              .sort((a, b) => Math.abs(a.y - cy) - Math.abs(b.y - cy));
    return cands[0] || null;
  }, label);
  if (!r2) return "CIRCLE LOST";

  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r2.x, y: r2.y });
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r2.x, y: r2.y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: r2.x, y: r2.y, button: "left", clickCount: 1 });
  await wait(3800);
  return "clicked circle for " + label;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const info = await newTab("https://www.fiverr.com/verification/user");
  const tab = new Tab(info.webSocketDebuggerUrl, info);
  await tab._connect();
  await wait(9000);

  for (const label of ["Verify your phone number", "Add your security question",
    "Add your personal and business information", "Upload your ID"]) {
    const r = await openSubTask(tab, label);
    console.log("\n===== " + label + " =====");
    console.log("open:", r);
    const s = await tab.eval(() => {
      const dlg = [...document.querySelectorAll("[role=dialog]")].filter(d => d.offsetParent !== null);
      const scope = dlg.length ? dlg[dlg.length - 1] : document;
      return {
        dlg: dlg.length,
        dlgText: dlg.length ? dlg[dlg.length - 1].innerText.replace(/\n+/g, " | ").slice(0, 600) : null,
        inputs: [...scope.querySelectorAll("input")].filter(e => e.offsetParent !== null)
          .map(e => `${e.type} ph="${e.placeholder || ""}" val="${(e.value || "").slice(0, 26)}"`),
        selects: [...scope.querySelectorAll("select")].filter(e => e.offsetParent !== null)
          .map(s => `${s.name || "(noname)"}: ${[...s.options].map(o => o.text.trim()).slice(0, 16).join(" | ")}`),
        btns: [...scope.querySelectorAll("button")].filter(b => b.offsetParent !== null)
          .map(b => (b.innerText || "").trim()).filter(x => x && x.length < 40).slice(0, 8)
      };
    });
    console.log(JSON.stringify(s, null, 1).slice(0, 1500));
  }
  try { await tab.shot("C:/Users/abder/freelance-pack/tools/_subs_now.png"); } catch {}
  process.exit(0);
}
