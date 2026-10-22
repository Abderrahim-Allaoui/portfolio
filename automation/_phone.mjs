// _phone.mjs — open the Fiverr "Verify your phone number" sub-task properly
import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const info = await newTab("https://www.fiverr.com/verification/user");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(6500);

// the radio CIRCLE is div._1rtxvgq1j next to the label. Scroll first, wait,
// THEN measure (a stale rect makes the click land on the wrong row).
const scrolled = await tab.eval(() => {
  const t = [...document.querySelectorAll("p")].find(e => (e.textContent || "").trim() === "Verify your phone number");
  if (!t) return "label not found";
  const row = t.parentElement?.parentElement;
  const circle = row?.querySelector("div._1rtxvgq1j");
  if (!circle) return "circle not found";
  circle.scrollIntoView({ block: "center" });
  return "scrolled";
});
console.log("scroll:", scrolled);
await wait(1500);

const rect = await tab.eval(() => {
  const t = [...document.querySelectorAll("p")].find(e => (e.textContent || "").trim() === "Verify your phone number");
  const row = t?.parentElement?.parentElement;
  const circle = row?.querySelector("div._1rtxvgq1j");
  if (!circle) return null;
  const r = circle.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, inView: r.top > 0 && r.bottom < window.innerHeight };
});
console.log("rect:", JSON.stringify(rect));

if (rect) {
  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: rect.x, y: rect.y });
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await wait(3500);
}

const ph = await tab.eval(() => {
  const dlg = [...document.querySelectorAll("[role=dialog]")].filter(d => d.offsetParent !== null);
  const scope = dlg.length ? dlg[dlg.length - 1] : document;
  return {
    dlgOpen: dlg.length,
    dlgText: dlg.length ? dlg[dlg.length - 1].innerText.replace(/\n+/g, " | ").slice(0, 600) : null,
    inputs: [...scope.querySelectorAll("input")].filter(e => e.offsetParent !== null)
      .map(e => `${e.type} ph="${e.placeholder || ""}" val="${(e.value || "").slice(0, 26)}"`),
    selects: [...scope.querySelectorAll("select")].filter(e => e.offsetParent !== null)
      .map(s => `${s.name || "(noname)"}: ${[...s.options].map(o => o.text.trim()).slice(0, 16).join(" | ")}`),
    btns: [...scope.querySelectorAll("button")].filter(b => b.offsetParent !== null)
      .map(b => (b.innerText || "").trim()).filter(x => x && x.length < 40).slice(0, 8)
  };
});
console.log("\nPHONE FORM:\n" + JSON.stringify(ph, null, 1).slice(0, 2200));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_phone2.png"); } catch {}
process.exit(0);
