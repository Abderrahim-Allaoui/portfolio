// probe_gig9.mjs — dump the Gig metadata checkboxes grouped by section
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/manage_gigs/new?wizard=0&tab=general");
await new Promise(r => setTimeout(r, 4500));

// fill step 1 quickly so the metadata section renders
await tab.eval(() => {
  const t = document.querySelector("textarea[maxlength='80']");
  const proto = HTMLTextAreaElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(t, "build verified B2B lead lists for Morocco, MENA and Africa");
  t.dispatchEvent(new Event("input", { bubbles: true }));
});
await tab.comboPick(".orca-combo-box.category-selector__control", "Data", 0);
await new Promise(r => setTimeout(r, 1000));
await tab.comboPick(".orca-combo-box.category-selector__control", "Data Scraping", 1);
await new Promise(r => setTimeout(r, 1000));

// scroll through and collect checkbox groups
const groups = await tab.eval(() => {
  const out = [];
  const seen = new Set();
  for (const cb of document.querySelectorAll("input[type=checkbox]")) {
    const lab = cb.closest("label") || cb.parentElement?.querySelector("label") || cb.parentElement;
    const txt = (lab?.innerText || "").trim().split("\n")[0];
    if (!txt || seen.has(txt)) continue;
    seen.add(txt);
    // find the nearest preceding bold/heading text as the section name
    let sec = "?", node = lab;
    for (let i = 0; i < 6 && node; i++) {
      const prev = node.previousElementSibling;
      if (prev && prev.innerText && prev.innerText.trim().length < 40 && /[A-Z\s*]+$/.test(prev.innerText.trim())) { sec = prev.innerText.trim(); break; }
      node = node.parentElement;
    }
    out.push({ sec, txt });
  }
  return out;
});
console.log("checkbox groups:");
for (const g of groups) console.log("  [" + g.sec + "] " + g.txt);

// also dump the visible section headers
const heads = await tab.eval(() => [...document.querySelectorAll("div,span,p,h1,h2,h3")]
  .filter(e => e.children.length === 0)
  .map(e => (e.textContent || "").trim())
  .filter(t => t && t.length < 40 && /[A-Z]{3,}/.test(t) && !/^[a-z]/.test(t))
  .slice(0, 40));
console.log("\nheaders:", JSON.stringify([...new Set(heads)]));
await tab.shot("C:/Users/abder/freelance-pack/tools/_gig_meta.png");
process.exit(0);
