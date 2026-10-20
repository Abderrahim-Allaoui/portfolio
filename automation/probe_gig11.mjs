// probe_gig11.mjs — screenshot the INFORMATION TYPE and TECHNIQUE sections
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/manage_gigs/new?wizard=0&tab=general");
await new Promise(r => setTimeout(r, 4500));

await tab.eval(() => {
  const t = document.querySelector("textarea[maxlength='80']");
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set
    .call(t, "build verified B2B lead lists for Morocco, MENA and Africa");
  t.dispatchEvent(new Event("input", { bubbles: true }));
});
await tab.comboPick(".orca-combo-box.category-selector__control", "Data", 0);
await new Promise(r => setTimeout(r, 900));
await tab.comboPick(".orca-combo-box.category-selector__control", "Data Scraping", 1);
await new Promise(r => setTimeout(r, 900));

// scroll so "Information type" is near the top, then shoot
for (const [name, file] of [["Information type", "_meta_info.png"], ["Technique", "_meta_tech.png"]]) {
  await tab.eval((n) => {
    const h = [...document.querySelectorAll("div,span,p,h1,h2,h3,h4")]
      .find(e => e.children.length === 0 && (e.textContent || "").trim().toLowerCase() === n.toLowerCase());
    if (h) h.scrollIntoView({ block: "start" });
  }, name);
  await new Promise(r => setTimeout(r, 1400));
  await tab.shot(`C:/Users/abder/freelance-pack/tools/${file}`);
  console.log("shot " + file);
}

// list options per section using the DOM container of each header
const groups = await tab.eval(() => {
  const out = {};
  for (const name of ["Technology", "Information type", "Technique"]) {
    const h = [...document.querySelectorAll("div,span,p,h1,h2,h3,h4")]
      .find(e => e.children.length === 0 && (e.textContent || "").trim().toLowerCase() === name.toLowerCase());
    if (!h) { out[name] = ["? header not found"]; continue; }
    // climb to the block that contains checkboxes
    let box = h;
    for (let i = 0; i < 8 && box; i++) {
      const cbs = [...box.querySelectorAll("input[type=checkbox]")];
      if (cbs.length) {
        out[name] = cbs.map(cb => {
          const lab = cb.closest("label") || cb.parentElement;
          return (lab?.innerText || "").trim().split("\n")[0];
        }).filter(Boolean);
        break;
      }
      box = box.parentElement;
    }
    if (!out[name]) out[name] = ["? no checkboxes"];
  }
  return out;
});
console.log(JSON.stringify(groups, null, 1).slice(0, 2500));
process.exit(0);
