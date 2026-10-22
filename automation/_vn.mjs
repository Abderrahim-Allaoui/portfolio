import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://www.fiverr.com/verification/user");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(7000);
const s = await tab.eval(() => ({
  url: location.href,
  title: document.title,
  body: document.body.innerText.slice(0, 900).replace(/\n+/g, " | "),
  ps: [...document.querySelectorAll("p")].map(p => (p.textContent||"").trim()).filter(t=>t && t.length<70).slice(0,14),
  circles: document.querySelectorAll("div._1rtxvgq1j").length
}));
console.log(JSON.stringify(s, null, 1).slice(0, 2200));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_verif_now.png"); } catch {}
process.exit(0);
