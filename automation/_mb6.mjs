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
await new Promise(r => setTimeout(r, 900));
await tab.comboPick(".orca-combo-box.category-selector__control", "Data Scraping", 1);
await new Promise(r => setTimeout(r, 900));
await tab.realClickText("Technology", "*", true);
await new Promise(r => setTimeout(r, 1100));
for (const t of ["Python","Scrapy","Selenium","Beautiful soup","Excel"]) await tab.checkByLabel(t);
await tab.realClickText("Information type", "*", true);
await new Promise(r => setTimeout(r, 1100));
for (const t of ["Lead generation","Contact information"]) await tab.checkByLabel(t);
await tab.realClickText("Technique", "*", true);
await new Promise(r => setTimeout(r, 1200));

const info = await tab.eval(() => {
  const e = document.querySelector(".meta-single-select");
  if (!e) return { err: "not found" };
  return {
    tag: e.tagName, outer: e.outerHTML.slice(0, 900),
    isSelect: e.tagName === "SELECT",
    options: e.tagName === "SELECT" ? [...e.options].map(o => o.value + "=" + o.text.trim()) : null
  };
});
console.log(JSON.stringify(info, null, 1).slice(0, 2200));
process.exit(0);
