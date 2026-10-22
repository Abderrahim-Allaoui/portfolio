import { Tab, newTab } from "./cdp.mjs";
import { openSubTask } from "./_phone4.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://www.fiverr.com/verification/user");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(9000);
console.log("circle:", await openSubTask(tab, "Verify your phone number"));
await wait(1500);
console.log("continue:", await tab.clickText("Continue", "button"));
await wait(5000);
console.log("url:", await tab.eval(() => location.href));
const s = await tab.eval(() => {
  const dlg = [...document.querySelectorAll("[role=dialog]")].filter(d => d.offsetParent !== null);
  const scope = dlg.length ? dlg[dlg.length-1] : document;
  return {
    dlg: dlg.length,
    dlgText: dlg.length ? dlg[dlg.length-1].innerText.replace(/\n+/g," | ").slice(0,700) : null,
    inputs: [...scope.querySelectorAll("input")].filter(e=>e.getClientRects().length).map(e=>`${e.type} ph="${e.placeholder||""}" val="${(e.value||"").slice(0,26)}"`),
    selects: [...scope.querySelectorAll("select")].filter(e=>e.getClientRects().length).map(x=>`${x.name||"(noname)"}: ${[...x.options].map(o=>o.text.trim()).slice(0,16).join(" | ")}`),
    btns: [...scope.querySelectorAll("button")].filter(b=>b.getClientRects().length).map(b=>(b.innerText||"").trim()).filter(x=>x&&x.length<40).slice(0,10),
    body: document.body.innerText.slice(150, 900).replace(/\n+/g," | ")
  };
});
console.log("\n" + JSON.stringify(s, null, 1).slice(0, 2200));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_after_continue.png"); } catch {}
process.exit(0);
