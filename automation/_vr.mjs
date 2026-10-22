import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/verification/user", "fiverr");
await wait(5000);
const h = await tab.eval(() => {
  const t = [...document.querySelectorAll("*")].find(e => !e.children.length && (e.textContent||"").trim() === "Add your personal and business information");
  if (!t) return "not found";
  let p = t;
  for (let i=0;i<3;i++) p = p.parentElement;
  return p.outerHTML.slice(0, 1600);
});
console.log(h);
process.exit(0);
