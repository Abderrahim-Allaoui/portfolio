// _upwork.mjs — is there an Upwork account? what does signup need?
import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const info = await newTab("https://www.upwork.com/nx/signup/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(8000);

const s = await tab.eval(() => ({
  url: location.href,
  title: document.title,
  head: document.body.innerText.slice(0, 900).replace(/\n+/g, " | "),
  inputs: [...document.querySelectorAll("input")].filter(e => e.getClientRects().length)
    .map(e => `${e.type} name="${e.name || e.id}" ph="${e.placeholder || ""}"`),
  buttons: [...document.querySelectorAll("button")].filter(b => b.getClientRects().length)
    .map(b => (b.innerText || "").trim()).filter(Boolean).slice(0, 10)
}));
console.log(JSON.stringify(s, null, 1).slice(0, 2200));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_upwork.png"); } catch {}
process.exit(0);
