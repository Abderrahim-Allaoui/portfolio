// upwork_verify2.mjs — open the Upwork verification email by thread id, grab the
// verification URL, and visit it in a fresh tab.
import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// thread id captured from the Gmail search result
const THREAD = "FMfcgzQhWxbwKjNqRDBpsjDXBjptGgjv";

const info = await newTab(`https://mail.google.com/mail/u/0/#inbox/${THREAD}`);
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(11000);

const links = await tab.eval(() => [...document.querySelectorAll("a[href]")]
  .map(a => ({ t: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 50), h: (a.getAttribute("href") || "") }))
  .filter(x => x.h && /upwork/i.test(x.h + " " + x.t))
  .filter(x => !/google|gmail|accounts\./i.test(x.h))
  .slice(0, 12));
console.log("candidates:", JSON.stringify(links, null, 1).slice(0, 2200));

// the verify link = the one with a path that mentions verify
const pick = links.find(l => /verif|confirm|activate/i.test(l.t + " " + l.h)) || links[0];
console.log("picked:", JSON.stringify(pick));

if (pick && pick.h) {
  const url = pick.h.startsWith("http") ? pick.h : "https://mail.google.com" + pick.h;
  const t2 = await newTab(url);
  const tab2 = new Tab(t2.webSocketDebuggerUrl, t2);
  await tab2._connect();
  await wait(11000);
  const res = await tab2.eval(() => ({
    url: location.href,
    title: document.title,
    head: document.body.innerText.slice(0, 600).replace(/\n+/g, " | ")
  }));
  console.log("\n=== AFTER VERIFY ===");
  console.log("url  :", res.url);
  console.log("title:", res.title);
  console.log("head :", res.head);
  try { await tab2.shot("C:/Users/abder/freelance-pack/tools/_upwork_verified.png"); } catch {}
}
process.exit(0);
