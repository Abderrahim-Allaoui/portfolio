import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/seller_dashboard", "fiverr");
await wait(4500);
const links = await tab.eval(() => [...document.querySelectorAll("a")]
  .map(a => ({ t: (a.innerText||"").trim().slice(0,30), h: a.getAttribute("href") }))
  .filter(x => x.h && !/^https?:\/\/(www\.)?fiverr\.com\/$/.test(x.h))
  .filter(x => /account|setting|verif|identity|profile|payment|billing|trust/i.test(x.t + " " + x.h))
  .slice(0, 12));
console.log(JSON.stringify(links, null, 1));
// open Account settings
const acc = links.find(x => /account settings/i.test(x.t));
if (acc) {
  await tab.goto(acc.h.startsWith("http") ? acc.h : "https://www.fiverr.com" + acc.h);
  await wait(4000);
  const s = await tab.eval(() => ({
    url: location.href, title: document.title,
    text: document.body.innerText.slice(0, 900),
    files: document.querySelectorAll("input[type=file]").length
  }));
  console.log("\nACCOUNT SETTINGS:\n" + JSON.stringify(s, null, 1).slice(0, 1600));
  try { await tab.shot("C:/Users/abder/freelance-pack/tools/_acct.png"); } catch {}
}
process.exit(0);
