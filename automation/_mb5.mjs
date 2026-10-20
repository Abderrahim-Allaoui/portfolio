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

// open the technique select and capture EVERYTHING that appears
const before = await tab.eval(() => document.querySelectorAll("body *").length);
const rect = await tab.eval(() => {
  const e = document.querySelector(".meta-single-select");
  if (!e) return null;
  e.scrollIntoView({ block: "center" });
  const r = e.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2 };
});
console.log("select rect:", JSON.stringify(rect));
await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
await new Promise(r => setTimeout(r, 1600));
const after = await tab.eval(() => {
  const all = [...document.querySelectorAll("body *")];
  const list = all.filter(e => {
    const c = (e.className||"").toString();
    return /option|menu|list/i.test(c) && e.offsetParent !== null;
  }).slice(0, 25).map(e => ({ tag: e.tagName, cls: (e.className||"").toString().slice(0,60), txt: (e.innerText||"").trim().slice(0,60) }));
  const li = [...document.querySelectorAll("li")].filter(e => e.offsetParent !== null).map(e => (e.innerText||"").trim().slice(0,40));
  const rad = [...document.querySelectorAll("input[type=radio]")].filter(e => e.offsetParent !== null).map(e => {
    const l = e.closest("label") || e.parentElement; return (l?.innerText||"").trim().split("\n")[0];
  });
  return { list, li, rad: [...new Set(rad)] };
});
console.log("after nodes:", before, "->", await tab.eval(() => document.querySelectorAll("body *").length));
console.log(JSON.stringify(after, null, 1).slice(0, 2500));
await tab.shot("C:/Users/abder/freelance-pack/tools/_tech2.png");
process.exit(0);
