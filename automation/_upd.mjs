import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://www.upwork.com/nx/signup/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(7000);
const s = await tab.eval(() => {
  const out = [];
  for (const e of document.querySelectorAll("*")) {
    const t = (e.innerText || "").trim();
    if (!/freelancer/i.test(t) || t.length > 60) continue;
    out.push({ tag: e.tagName, t, cls: (e.className||"").toString().slice(0,50), kids: e.children.length, onclick: !!e.onclick });
  }
  return out.slice(0, 14);
});
console.log(JSON.stringify(s, null, 1).slice(0, 2200));
process.exit(0);
