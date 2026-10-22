import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://mail.google.com/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(9000);
const s = await tab.eval(() => ({
  url: location.href,
  title: document.title,
  head: document.body.innerText.slice(0, 400).replace(/\n+/g, " | "),
  loggedIn: /inbox|@gmail|Google Account/i.test(document.body.innerText) && !/Sign in/i.test(document.body.innerText.slice(0,300))
}));
console.log(JSON.stringify(s, null, 1).slice(0, 1200));
process.exit(0);
