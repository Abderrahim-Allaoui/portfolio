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
await new Promise(r => setTimeout(r, 1000));

// technology tab: open the picker and check 5
await tab.realClickText("Technology", "*", true);
await new Promise(r => setTimeout(r, 1200));
for (const t of ["Python","Scrapy","Selenium","Beautiful soup","Excel"]) console.log(t+":", await tab.checkByLabel(t));
// information type tab
await tab.realClickText("Information type", "*", true);
await new Promise(r => setTimeout(r, 1200));
for (const t of ["Lead generation","Contact information"]) console.log(t+":", await tab.checkByLabel(t));
// technique tab
console.log("click Technique:", await tab.realClickText("Technique", "*", true));
await new Promise(r => setTimeout(r, 1400));

// find ANY element whose innerText starts with CHOOSE
const rect = await tab.eval(() => {
  const els = [...document.querySelectorAll("div,span,button,p")].filter(e => {
    const t = (e.innerText || "").trim();
    return /^CHOOSE/i.test(t) && t.length < 25;
  });
  const e = els[0];
  if (!e) return null;
  e.scrollIntoView({ block: "center" });
  const r = e.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2, tag: e.tagName, cls: (e.className||"").toString().slice(0,60), txt: e.innerText.trim() };
});
console.log("choose el:", JSON.stringify(rect));
if (rect) {
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await new Promise(r => setTimeout(r, 1500));
  const opts = await tab.eval(() => {
    const out = [];
    for (const e of document.querySelectorAll("li,[role=option],label,div")) {
      if (e.children.length) continue;
      const t = (e.textContent||"").trim();
      if (t && t.length < 40 && e.offsetParent !== null) out.push(t);
    }
    return [...new Set(out)];
  });
  console.log("opts:", JSON.stringify(opts.slice(0, 40)));
}
await tab.shot("C:/Users/abder/freelance-pack/tools/_tech.png");
process.exit(0);
