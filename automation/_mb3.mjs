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
await new Promise(r => setTimeout(r, 1200));

const out = await tab.eval(() => {
  const choose = [...document.querySelectorAll("*")].filter(e =>
    !e.children.length && /choose/i.test(e.textContent||"") && (e.textContent||"").trim().length < 20);
  const heads = [...document.querySelectorAll("div,span,p,h1,h2,h3,h4,label")]
    .filter(e => !e.children.length && (e.textContent||"").trim())
    .map(e => ({ t: (e.textContent||"").trim(), y: Math.round(e.getBoundingClientRect().top + window.scrollY) }))
    .filter(o => /metadata|technology|information|technique|choose|scrape/i.test(o.t));
  return {
    choose: choose.map(e => ({ tag: e.tagName, cls: (e.className||"").toString().slice(0,70), txt: e.textContent.trim(), y: Math.round(e.getBoundingClientRect().top+window.scrollY), parent: e.parentElement?.outerHTML.slice(0,300) })),
    heads
  };
});
console.log(JSON.stringify(out, null, 1).slice(0, 3000));
process.exit(0);
