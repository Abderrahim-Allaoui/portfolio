import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://www.instagram.com/direct/inbox/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(6000);
const s = await tab.eval(() => {
  const t = document.body.innerText;
  return { head: t.slice(0, 700).replace(/\n+/g, " | ") };
});
console.log(s.head);
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_ig_inbox.png"); } catch {}
process.exit(0);
