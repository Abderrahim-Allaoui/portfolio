import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/verification/user", "fiverr");
await wait(5000);

const realCircle = async (label) => {
  const rect = await tab.eval((n) => {
    const t = [...document.querySelectorAll("p")].find(e => (e.textContent||"").trim() === n);
    if (!t) return null;
    const row = t.parentElement?.parentElement;
    const circle = row?.querySelector("div._1rtxvgq1j");
    if (!circle) return null;
    circle.scrollIntoView({ block: "center" });
    const r = circle.getBoundingClientRect();
    return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, h: r.height };
  }, label);
  if (!rect) return "not found";
  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: rect.x, y: rect.y });
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await wait(3000);
  return "real click at " + Math.round(rect.x) + "," + Math.round(rect.y);
};

console.log("pers:", await realCircle("Add your personal and business information"));
const s = await tab.eval(() => {
  const dlg = [...document.querySelectorAll("[role=dialog]")].filter(d=>d.offsetParent!==null);
  const scope = dlg.length ? dlg[dlg.length-1] : document;
  return {
    dlg: dlg.length ? dlg[dlg.length-1].innerText.replace(/\n+/g," | ").slice(0,700) : null,
    inputs: [...scope.querySelectorAll("input")].filter(e=>e.offsetParent!==null).map(e=>`${e.type} ph="${e.placeholder||""}" lbl="${(e.closest("label")?.innerText||e.parentElement?.innerText||"").trim().split("\n")[0].slice(0,50)}" val="${(e.value||"").slice(0,24)}"`),
    selects: [...scope.querySelectorAll("select")].filter(e=>e.offsetParent!==null).map(x=>`${x.name||"(noname)"}: ${[...x.options].map(o=>o.text.trim()).slice(0,14).join(" | ")}`),
    files: [...scope.querySelectorAll("input[type=file]")].map(e=>e.accept||"(any)")
  };
});
console.log("\ndialog :", s.dlg);
console.log("inputs :", JSON.stringify(s.inputs, null, 1).slice(0,1200));
console.log("selects:", JSON.stringify(s.selects, null, 1).slice(0,900));
console.log("files  :", JSON.stringify(s.files));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_v3_pers.png"); } catch {}
process.exit(0);
