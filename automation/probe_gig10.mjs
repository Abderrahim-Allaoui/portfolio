// probe_gig10.mjs — group metadata checkboxes by the nearest header above them
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

// scroll down so the metadata block is laid out
await tab.eval(() => {
  const el = [...document.querySelectorAll("div")].find(e => /Gig metadata/i.test(e.innerText || "") && e.children.length < 8);
  if (el) el.scrollIntoView({ block: "start" });
});
await new Promise(r => setTimeout(r, 1200));

const out = await tab.eval(() => {
  const heads = [];
  for (const e of document.querySelectorAll("div,span,p,h1,h2,h3,h4")) {
    if (e.children.length) continue;
    const t = (e.textContent || "").trim();
    if (!t || t.length > 45) continue;
    if (!/^(technology|information type|technique)\b/i.test(t)) continue;
    const r = e.getBoundingClientRect();
    if (r.width === 0) continue;
    heads.push({ t, y: r.top + window.scrollY });
  }
  heads.sort((a, b) => a.y - b.y);

  const cbs = [];
  for (const cb of document.querySelectorAll("input[type=checkbox]")) {
    const lab = cb.closest("label") || cb.parentElement;
    const t = (lab?.innerText || "").trim().split("\n")[0];
    if (!t) continue;
    const r = cb.getBoundingClientRect();
    cbs.push({ t, y: r.top + window.scrollY });
  }
  cbs.sort((a, b) => a.y - b.y);

  const groups = {};
  for (const c of cbs) {
    let sec = "?";
    for (const h of heads) { if (h.y <= c.y + 5) sec = h.t; else break; }
    (groups[sec] = groups[sec] || []).push(c.t);
  }
  return { heads: heads.map(h => h.t), groups };
});

console.log("HEADERS:", JSON.stringify([...new Set(out.heads)]));
for (const [k, v] of Object.entries(out.groups)) {
  console.log("\n### " + k + "  (" + v.length + ")");
  console.log("   " + v.join(" | "));
}
process.exit(0);
