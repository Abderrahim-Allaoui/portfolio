import { Tab, fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/manage_gigs/new?wizard=0&tab=general");
await new Promise(r => setTimeout(r, 4500));
const counter = () => tab.eval(() => (document.body.innerText.match(/\d+ \/ 5/) || [])[0] || "-");
const metaTabs = () => tab.eval(() => {
  const el = [...document.querySelectorAll("li")].find(e => /TECHNOLOGY|INFORMATION TYPE|TECHNIQUE/i.test(e.innerText||"") && e.children.length<=2);
  return el ? el.innerText.trim().split("\n")[0] : "?";
});
console.log("counter before:", await counter());
await tab.realClickText("Technology", "*", true);
await new Promise(r => setTimeout(r, 1200));
console.log("after tab click, counter:", await counter());
for (const t of ["Python","Scrapy","Selenium","Beautiful soup","Excel"]) {
  const r = await tab.checkByLabel(t);
  await new Promise(res => setTimeout(res, 300));
  console.log("  " + t + " -> " + r + " | counter=" + await counter());
}
console.log("checked state:", await tab.eval(() => {
  const cbs = [...document.querySelectorAll("input[type=checkbox]")].filter(c => c.offsetParent !== null);
  return cbs.map(c => { const l = c.closest("label")||c.parentElement; return (l?.innerText||"").trim().split("\n")[0] + "=" + c.checked; }).join(" ");
}));
await tab.shot("C:/Users/abder/freelance-pack/tools/_ck1.png");
process.exit(0);
