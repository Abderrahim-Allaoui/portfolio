import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://www.instagram.com/direct/inbox/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(7000);
const s = await tab.eval(() => {
  const t = document.body.innerText;
  const names = [...new Set((t.match(/[A-Z][A-Za-zÀ-ÿ' .+-]{3,40}(?=\s*You:)/g) || []))];
  const youCount = (t.match(/You:/g) || []).length;
  return { youCount, names: names.slice(0, 20), head: t.slice(0, 300).replace(/\n+/g," | ") };
});
console.log("threads with 'You:':", s.youCount);
console.log("recipients:", JSON.stringify(s.names));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_ig_inbox_final.png"); } catch {}
process.exit(0);
