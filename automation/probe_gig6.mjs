// probe_gig6.mjs — list every option in the Data subcategory menu
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/manage_gigs/new?wizard=0&tab=general");
await new Promise(r => setTimeout(r, 4500));

// category -> Data
await tab.comboPick(".orca-combo-box.category-selector__control", "Data", 0);
await new Promise(r => setTimeout(r, 1200));

// open the subcategory menu
const rect = await tab.eval(() => {
  const c = document.querySelectorAll(".orca-combo-box.category-selector__control")[1];
  c.scrollIntoView({ block: "center" });
  const r = c.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
await new Promise(r => setTimeout(r, 1500));

const list = await tab.eval(() => {
  // the dropdown list is the element that holds the option rows
  const cands = [...document.querySelectorAll("*")].filter(e => {
    const t = (e.innerText || "");
    return e.offsetParent !== null && /\d+ results available/.test(t) && t.length < 4000;
  });
  const el = cands.sort((a, b) => (a.innerText || "").length - (b.innerText || "").length)[0];
  if (!el) return { err: "no menu", texts: [...document.querySelectorAll("li")].map(l => l.innerText.trim()).filter(Boolean).slice(0, 30) };
  return {
    raw: (el.innerText || "").slice(0, 1200),
    items: [...new Set((el.innerText || "").split("\n").map(s => s.trim()).filter(Boolean))].slice(0, 40)
  };
});
console.log(JSON.stringify(list, null, 1).slice(0, 2500));
await tab.shot("C:/Users/abder/freelance-pack/tools/_gig_probe6.png");
process.exit(0);
