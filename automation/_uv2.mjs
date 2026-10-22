import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://mail.google.com/mail/u/0/#search/Upwork");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(10000);
await tab.eval(() => {
  const el = [...document.querySelectorAll("tr")].find(r => /upwork/i.test(r.innerText||"") && /verif/i.test(r.innerText||""));
  if (el) el.click();
});
await wait(7000);
const links = await tab.eval(() => [...document.querySelectorAll("a[href]")]
  .map(a => ({ t: (a.innerText||"").trim().slice(0,40), h: (a.getAttribute("href")||"").slice(0,110) }))
  .filter(x => /verif|upwork\.com/i.test(x.t + " " + x.h)).slice(0, 10));
console.log("links:", JSON.stringify(links, null, 1).slice(0, 1600));
const clicked = await tab.eval(() => {
  const a = [...document.querySelectorAll("a[href]")].find(x => {
    const t = (x.innerText||"").trim().toLowerCase();
    const h = (x.getAttribute("href")||"");
    return (t === "verify email" || /verify-email|email-verify|verify_email/.test(h)) && !/utm_|mailto/.test(h);
  });
  if (!a) return "no verify link";
  a.setAttribute("target","_blank");
  a.click();
  return "clicked: " + (a.innerText||"").trim();
});
console.log("click:", clicked);
await wait(10000);
console.log("url:", await tab.eval(() => location.href));
console.log("head:", (await tab.eval(() => document.body.innerText)).slice(0,400).replace(/\n+/g," | "));
process.exit(0);
