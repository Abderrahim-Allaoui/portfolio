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

// dump the whole metadata block
const meta = await tab.eval(() => {
  const h = [...document.querySelectorAll("div,span,p,h1,h2,h3,h4")]
    .find(e => e.children.length === 0 && /^gig metadata$/i.test((e.textContent||"").trim()));
  if (!h) return { err: "no Gig metadata header" };
  let box = h;
  for (let i = 0; i < 6 && box; i++) {
    if (box.querySelectorAll("input").length >= 3) break;
    box = box.parentElement;
  }
  return {
    cls: (box.className||"").toString().slice(0,90),
    controls: [...box.querySelectorAll("input, [role=combobox], .orca-combo-box, select")]
      .map(e => ({ tag: e.tagName, type: e.type, id: e.id, cls: (e.className||"").toString().slice(0,70), txt: (e.innerText||e.placeholder||"").trim().slice(0,40) })).slice(0, 20),
    headers: [...box.querySelectorAll("div,span,p")].filter(e => !e.children.length && e.innerText && e.innerText.trim().length < 30)
      .map(e => e.innerText.trim()).slice(0, 12)
  };
});
console.log(JSON.stringify(meta, null, 1).slice(0, 3000));
process.exit(0);
