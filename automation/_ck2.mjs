import { Tab, fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/manage_gigs/new?wizard=0&tab=general");
await new Promise(r => setTimeout(r, 4500));
await tab.eval(() => {
  const t = document.querySelector("textarea[maxlength='80']");
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(t, "build verified B2B lead lists for Morocco, MENA and Africa");
  t.dispatchEvent(new Event("input", { bubbles: true }));
});
await tab.comboPick(".orca-combo-box.category-selector__control", "Data", 0);
await new Promise(r => setTimeout(r, 1000));
await tab.comboPick(".orca-combo-box.category-selector__control", "Data Scraping", 1);
await new Promise(r => setTimeout(r, 1200));
const counter = () => tab.eval(() => {
  const m = document.body.innerText.match(/\d+ \/ 5/);
  const miss = document.body.innerText.match(/Mandatory metadata is missing/);
  return (m ? m[0] : "-") + (miss ? " +MISSING" : "");
});
console.log("counter:", await counter());
await tab.realClickText("Technology", "*", true);
await new Promise(r => setTimeout(r, 1300));
console.log("after tab:", await counter());
for (const t of ["Python","Scrapy","Selenium","Beautiful soup","Excel"]) {
  const r = await tab.checkByLabel(t);
  await new Promise(res => setTimeout(res, 400));
  console.log("  " + t + " -> " + r + " | " + await counter());
}
await tab.shot("C:/Users/abder/freelance-pack/tools/_ck2.png");
console.log("now save...");
console.log("save:", await tab.clickText("Save & Continue", "button"));
await new Promise(r => setTimeout(r, 4500));
console.log("after save:", await counter());
console.log("url:", await tab.eval(() => location.href));
await tab.shot("C:/Users/abder/freelance-pack/tools/_ck3.png");
process.exit(0);
