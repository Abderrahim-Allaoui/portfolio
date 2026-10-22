import { Tab, newTab } from "./cdp.mjs";
import { openSubTask } from "./_phone4.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://www.fiverr.com/verification/user");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(9000);
console.log(await openSubTask(tab, "Verify your phone number"));
await wait(2000);
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_after_circle.png"); } catch {}
// dump WITHOUT the offsetParent filter (fixed-position portals have offsetParent = null)
const d = await tab.eval(() => ({
  inputs: [...document.querySelectorAll("input")].map(e => `${e.type} ph="${e.placeholder||""}" val="${(e.value||"").slice(0,20)}" rects=${e.getClientRects().length}`).slice(0,10),
  textareas: document.querySelectorAll("textarea").length,
  ces: [...document.querySelectorAll('[contenteditable="true"]')].length,
  body: document.body.innerText.slice(150, 800).replace(/\n+/g," | ")
}));
console.log(JSON.stringify(d, null, 1).slice(0, 1600));
process.exit(0);
