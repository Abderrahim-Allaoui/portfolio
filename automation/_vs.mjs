import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/verification/user", "fiverr");
await wait(5000);
const h = await tab.eval(() => {
  const t = [...document.querySelectorAll("*")].filter(e => !e.children.length && /primary job/i.test((e.textContent||"").trim()));
  const el = t[t.length-1];
  return {
    texts: t.map(e => e.tagName + ":" + (e.textContent||"").trim().slice(0,60)),
    html: el?.parentElement?.parentElement?.outerHTML.slice(0, 900) || "none"
  };
});
console.log(JSON.stringify(h, null, 1).slice(0, 1600));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_vshot.png"); } catch {}
process.exit(0);
