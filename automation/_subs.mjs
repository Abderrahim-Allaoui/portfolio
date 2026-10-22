// _subs.mjs — open all 4 Fiverr verification sub-tasks (circle -> Continue) and dump
import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const info = await newTab("https://www.fiverr.com/verification/user");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(9000);

const clickCircle = async (label) => {
  const r = await tab.eval((l) => {
    const p = [...document.querySelectorAll("p")].find(e => (e.textContent || "").trim() === l);
    if (!p) return null;
    const lr = p.getBoundingClientRect();
    const cy = lr.top + lr.height / 2;
    const cands = [...document.querySelectorAll("div._1rtxvgq1j")].map(c => {
      const r = c.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    }).filter(o => o.w >= 10 && o.w <= 28 && o.h >= 10 && o.h <= 28 && o.x <= lr.x + 5)
            .sort((a, b) => Math.abs(a.y - cy) - Math.abs(b.y - cy));
    if (!cands.length) return null;
    cands[0].c && 0;
    return cands[0];
  }, label);
  if (!r) return "no circle";
  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.x, y: r.y });
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r.x, y: r.y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: r.x, y: r.y, button: "left", clickCount: 1 });
  await wait(1400);
  return "circle";
};

const TASKS = ["Verify your phone number", "Add your security question",
  "Add your personal and business information", "Upload your ID"];

for (const t of TASKS) {
  // close any open dialog first
  await tab.eval(() => {
    const b = [...document.querySelectorAll("button")].find(x =>
      (x.getAttribute("aria-label") || "").toLowerCase().includes("close") && x.getClientRects().length);
    if (b) b.click();
  });
  await wait(1200);

  console.log("\n########## " + t + " ##########");
  console.log("circle:", await clickCircle(t));
  await wait(1200);
  await tab.clickText("Continue", "button");
  await wait(4500);

  const s = await tab.eval(() => {
    const dlg = [...document.querySelectorAll("[role=dialog]")].filter(d => d.getClientRects().length);
    const scope = dlg.length ? dlg[dlg.length - 1] : document;
    return {
      dlg: dlg.length,
      text: dlg.length ? dlg[dlg.length - 1].innerText.replace(/\n+/g, " | ").slice(0, 800) : null,
      inputs: [...scope.querySelectorAll("input")].filter(e => e.getClientRects().length)
        .map(e => `${e.type} ph="${e.placeholder || ""}" val="${(e.value || "").slice(0, 30)}"`),
      textareas: [...scope.querySelectorAll("textarea")].filter(e => e.getClientRects().length)
        .map(e => `ph="${e.placeholder || ""}" val="${(e.value || "").slice(0, 30)}"`),
      selects: [...scope.querySelectorAll("select")].filter(e => e.getClientRects().length)
        .map(x => `${x.name || "(noname)"}: ${[...x.options].map(o => o.text.trim()).slice(0, 16).join(" | ")}`),
      radios: [...scope.querySelectorAll("input[type=radio]")].filter(e => e.getClientRects().length)
        .map(e => { const l = e.closest("label")?.innerText || e.parentElement?.innerText || ""; return (l || e.value).trim().split("\n")[0].slice(0, 45); }),
      files: [...scope.querySelectorAll("input[type=file]")].map(e => e.accept || "(any)"),
      btns: [...scope.querySelectorAll("button")].filter(b => b.getClientRects().length)
        .map(b => (b.innerText || "").trim()).filter(x => x && x.length < 40).slice(0, 10)
    };
  });
  console.log(JSON.stringify(s, null, 1).slice(0, 2000));
  try { await tab.shot(`C:/Users/abder/freelance-pack/tools/_sub_${t.split(" ").pop()}.png`); } catch {}
}
process.exit(0);
