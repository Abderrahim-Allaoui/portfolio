import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://www.upwork.com/nx/signup/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(7000);
await tab.eval(() => { const e=[...document.querySelectorAll("a")].find(x=>{const t=(x.innerText||"").trim().toLowerCase();return t.indexOf("a freelancer")>=0&&t.length<60;}); if(e) e.click(); });
await wait(5500);
await tab.eval(() => { const b=[...document.querySelectorAll("button")].find(x=>/continue with email/i.test((x.innerText||"").trim())); if(b) b.click(); });
await wait(5000);
const d = await tab.eval(() => ({
  url: location.href,
  head: document.body.innerText.slice(0,500).replace(/\n+/g," | "),
  inputs: [...document.querySelectorAll("input")].filter(e=>e.getClientRects().length).map(e=>`${e.type} name="${e.name||e.id}" ph="${e.placeholder||""}" aut="${e.getAttribute("autocomplete")||""}"`),
  buttons: [...document.querySelectorAll("button")].filter(b=>b.getClientRects().length).map(b=>(b.innerText||"").trim()).filter(Boolean).slice(0,8)
}));
console.log("url:", d.url);
console.log("head:", d.head);
console.log("inputs:\n  " + d.inputs.join("\n  "));
console.log("buttons:", JSON.stringify(d.buttons));
process.exit(0);
