// _phone2.mjs — open the phone sub-task: pick the circle in the SAME row as the label
import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const info = await newTab("https://www.fiverr.com/verification/user");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(9000);

// list every circle with the label text of its row
const circles = await tab.eval(() => {
  const out = [];
  document.querySelectorAll("div._1rtxvgq1j").forEach((c, i) => {
    const row = c.parentElement?.parentElement;
    const p = row?.querySelector("p");
    const r = c.getBoundingClientRect();
    out.push({ i, label: (p?.textContent || "").trim().slice(0, 45), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), inView: r.top > 60 && r.bottom < window.innerHeight - 60 });
  });
  return out;
});
console.log("circles:", JSON.stringify(circles, null, 1).slice(0, 2000));

const target = circles.find(c => /phone/i.test(c.label));
if (!target) { console.log("no phone circle"); process.exit(0); }

// scroll it into view, wait, then re-measure
await tab.eval((y) => window.scrollTo(0, Math.max(0, y - 300)), target.y);
await wait(1200);
const rect = await tab.eval((label) => {
  const p = [...document.querySelectorAll("p")].find(e => (e.textContent || "").trim() === label);
  const row = p?.parentElement?.parentElement;
  const circle = row?.querySelector("div._1rtxvgq1j");
  if (!circle) return null;
  const r = circle.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
}, target.label);
console.log("rect:", JSON.stringify(rect));

if (rect) {
  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: rect.x, y: rect.y });
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await wait(4000);
}

const ph = await tab.eval(() => {
  const dlg = [...document.querySelectorAll("[role=dialog]")].filter(d => d.offsetParent !== null);
  const scope = dlg.length ? dlg[dlg.length - 1] : document;
  return {
    dlgOpen: dlg.length,
    dlgText: dlg.length ? dlg[dlg.length - 1].innerText.replace(/\n+/g, " | ").slice(0, 700) : null,
    inputs: [...scope.querySelectorAll("input")].filter(e => e.offsetParent !== null)
      .map(e => `${e.type} ph="${e.placeholder || ""}" val="${(e.value || "").slice(0, 26)}"`),
    selects: [...scope.querySelectorAll("select")].filter(e => e.offsetParent !== null)
      .map(s => `${s.name || "(noname)"}: ${[...s.options].map(o => o.text.trim()).slice(0, 16).join(" | ")}`),
    btns: [...scope.querySelectorAll("button")].filter(b => b.offsetParent !== null)
      .map(b => (b.innerText || "").trim()).filter(x => x && x.length < 40).slice(0, 8)
  };
});
console.log("\nPHONE FORM:\n" + JSON.stringify(ph, null, 1).slice(0, 2200));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_phone3.png"); } catch {}
process.exit(0);
