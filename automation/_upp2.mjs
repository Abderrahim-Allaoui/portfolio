import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://www.upwork.com/nx/create-profile/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(22000);
const s = await tab.eval(() => ({
  url: location.href,
  ready: document.readyState,
  bodyLen: document.body.innerText.length,
  head: document.body.innerText.slice(0, 900).replace(/\n+/g, " | "),
  inputs: [...document.querySelectorAll("input,textarea")].filter(e => e.getClientRects().length)
    .map(e => `${e.tagName}/${e.type||""} name="${e.name||e.id||""}" ph="${(e.placeholder||"").slice(0,40)}"`),
  buttons: [...document.querySelectorAll("button")].filter(b => b.getClientRects().length)
    .map(b => (b.innerText||"").trim()).filter(Boolean).slice(0,10)
}));
console.log("url:", s.url, "| ready:", s.ready, "| bodyLen:", s.bodyLen);
console.log("head:", s.head);
console.log("inputs:\n  " + s.inputs.join("\n  "));
console.log("buttons:", JSON.stringify(s.buttons));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_upwork_profile.png"); } catch {}
process.exit(0);
