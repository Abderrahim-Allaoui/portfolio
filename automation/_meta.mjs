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

for (const name of ["Information type", "Technique"]) {
  const r = await tab.realClickText(name, "div,span,button,label", false);
  await new Promise(res => setTimeout(res, 1400));
  console.log("clicked " + name + " -> " + r);
  const opts = await tab.eval(() => {
    // the options panel: the visible checkbox group that is NOT the technology grid
    const vis = [...document.querySelectorAll("input[type=checkbox]")].filter(c => c.offsetParent !== null);
    const labels = vis.map(cb => { const l = cb.closest("label") || cb.parentElement; return (l?.innerText||"").trim().split("\n")[0]; }).filter(Boolean);
    return [...new Set(labels)];
  });
  console.log("   options: " + opts.join(" | "));
  await tab.shot(`C:/Users/abder/freelance-pack/tools/_meta_${name.replace(/ /g,"_")}.png`);
}
process.exit(0);
