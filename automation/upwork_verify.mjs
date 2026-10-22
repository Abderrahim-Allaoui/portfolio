// upwork_verify.mjs — open the Upwork verification email in Gmail and click the link
import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const info = await newTab("https://mail.google.com/mail/u/0/#search/Upwork");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(10000);

const found = await tab.eval(() => {
  const rows = [...document.querySelectorAll("tr")].map(r => (r.innerText || "").trim()).filter(Boolean);
  const hit = rows.find(t => /upwork/i.test(t) && /verif/i.test(t));
  return { hit: hit ? hit.slice(0, 140) : null, rows: rows.length };
});
console.log("email found:", JSON.stringify(found));

// open it
await tab.eval(() => {
  const el = [...document.querySelectorAll("tr")].find(r => /upwork/i.test(r.innerText || "") && /verif/i.test(r.innerText || ""));
  if (el) el.click();
});
await wait(7000);

const body = await tab.eval(() => ({
  url: location.href,
  head: document.body.innerText.slice(0, 700).replace(/\n+/g, " | "),
  links: [...document.querySelectorAll("a[href]")].map(a => (a.innerText || a.getAttribute("aria-label") || "").trim())
    .filter(t => /verif|confirm|activate|continue/i.test(t)).slice(0, 6)
}));
console.log("opened:", JSON.stringify(body, null, 1).slice(0, 1500));

// click the verification link
const clicked = await tab.eval(() => {
  const a = [...document.querySelectorAll("a[href]")].find(x => {
    const t = (x.innerText || x.getAttribute("aria-label") || "").trim();
    return /verif|confirm|activate|continue/i.test(t) || /verify|confirm/i.test(x.getAttribute("href") || "");
  });
  if (!a) return "no verify link";
  a.click();
  return "clicked: " + (a.innerText || a.getAttribute("href")).trim().slice(0, 60);
});
console.log("verify:", clicked);
await wait(10000);

const after = await tab.eval(() => ({
  url: location.href,
  head: document.body.innerText.slice(0, 600).replace(/\n+/g, " | ")
}));
console.log("final url :", after.url);
console.log("final head:", after.head);
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_upwork_verified.png"); } catch {}
process.exit(0);
