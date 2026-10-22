import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://www.instagram.com/rickscafe_casablanca/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(5000);
await tab.eval(() => {
  const b = [...document.querySelectorAll("button,a,div[role=button]")].find(e => e.offsetParent !== null && /^(Message|Messenger)$/i.test((e.innerText||"").trim()));
  if (b) b.click();
});
await wait(4000);
const d = await tab.eval(() => ({
  textareas: [...document.querySelectorAll("textarea")].map(t => ({ vis: t.offsetParent !== null, ph: t.placeholder, cls: (t.className||"").slice(0,40) })),
  ces: [...document.querySelectorAll('[contenteditable="true"]')].map(e => ({ vis: e.offsetParent !== null, aria: e.getAttribute("aria-label"), role: e.getAttribute("role"), cls: (e.className||"").slice(0,40), txt: (e.innerText||"").slice(0,30) })),
  inputs: [...document.querySelectorAll("input")].filter(e=>e.offsetParent!==null).map(e => ({ type: e.type, ph: e.placeholder, aria: e.getAttribute("aria-label") })),
  btns: [...document.querySelectorAll("button")].filter(b=>b.offsetParent!==null).map(b => ({ t: (b.innerText||"").trim().slice(0,20), aria: b.getAttribute("aria-label") })).slice(-12)
}));
console.log(JSON.stringify(d, null, 1).slice(0, 2600));
process.exit(0);
