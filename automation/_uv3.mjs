import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const THREAD = "FMfcgzQhWxbwKjNqRDBpsjDXBjptGgjv";

const info = await newTab(`https://mail.google.com/mail/u/0/#inbox/${THREAD}`);
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(11000);

const pick = await tab.eval(() => {
  const a = [...document.querySelectorAll("a[href]")].find(x =>
    /\/verify-email\/token\//.test(x.getAttribute("href") || ""));
  return a ? (a.getAttribute("href") || "") : null;
});
console.log("verify url:", pick);
if (!pick) { console.log("no token link"); process.exit(1); }

const t2 = await newTab(pick);
const tab2 = new Tab(t2.webSocketDebuggerUrl, t2);
await tab2._connect();
await wait(12000);
const res = await tab2.eval(() => ({
  url: location.href,
  title: document.title,
  head: document.body.innerText.slice(0, 700).replace(/\n+/g, " | ")
}));
console.log("\nurl  :", res.url);
console.log("title:", res.title);
console.log("head :", res.head);
try { await tab2.shot("C:/Users/abder/freelance-pack/tools/_upwork_verified.png"); } catch {}
process.exit(0);
