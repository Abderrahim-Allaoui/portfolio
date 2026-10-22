import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://www.fiverr.com/verification/user");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(9000);

const rect = await tab.eval(() => {
  const p = [...document.querySelectorAll("p")].find(e => (e.textContent||"").trim() === "Verify your phone number");
  const row = p?.parentElement?.parentElement;
  if (!row) return null;
  // the radio circle is the small square (16x16); the others are 2px connector lines
  const cand = [...row.querySelectorAll("div._1rtxvgq1j")].filter(c => {
    const r = c.getBoundingClientRect();
    return r.width >= 10 && r.width <= 26 && r.height >= 10 && r.height <= 26;
  });
  const circle = cand[0];
  if (!circle) return { err: "no small circle", all: [...row.querySelectorAll("div._1rtxvgq1j")].length };
  circle.scrollIntoView({ block: "center" });
  const r = circle.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, h: r.height };
});
console.log("rect:", JSON.stringify(rect));
if (rect && rect.x) {
  await wait(1200);
  const r2 = await tab.eval(() => {
    const p = [...document.querySelectorAll("p")].find(e => (e.textContent||"").trim() === "Verify your phone number");
    const row = p?.parentElement?.parentElement;
    const cand = [...row.querySelectorAll("div._1rtxvgq1j")].filter(c => {
      const r = c.getBoundingClientRect();
      return r.width >= 10 && r.width <= 26 && r.height >= 10 && r.height <= 26;
    });
    const r = cand[0].getBoundingClientRect();
    return { x: r.x + r.width/2, y: r.y + r.height/2 };
  });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r2.x, y: r2.y });
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r2.x, y: r2.y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: r2.x, y: r2.y, button: "left", clickCount: 1 });
  await wait(4000);
}
const ph = await tab.eval(() => {
  const dlg = [...document.querySelectorAll("[role=dialog]")].filter(d => d.offsetParent !== null);
  const scope = dlg.length ? dlg[dlg.length - 1] : document;
  return {
    dlgOpen: dlg.length,
    dlgText: dlg.length ? dlg[dlg.length-1].innerText.replace(/\n+/g," | ").slice(0,700) : null,
    inputs: [...scope.querySelectorAll("input")].filter(e=>e.offsetParent!==null).map(e=>`${e.type} ph="${e.placeholder||""}" val="${(e.value||"").slice(0,26)}"`),
    selects: [...scope.querySelectorAll("select")].filter(e=>e.offsetParent!==null).map(s=>`${s.name||"(noname)"}: ${[...s.options].map(o=>o.text.trim()).slice(0,16).join(" | ")}`),
    btns: [...scope.querySelectorAll("button")].filter(b=>b.offsetParent!==null).map(b=>(b.innerText||"").trim()).filter(x=>x&&x.length<40).slice(0,8)
  };
});
console.log("\nPHONE FORM:\n" + JSON.stringify(ph, null, 1).slice(0, 2000));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_phone4.png"); } catch {}
process.exit(0);
