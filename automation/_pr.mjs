import { Tab, fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/manage_gigs/new?wizard=0&tab=general");
await new Promise(r => setTimeout(r, 4500));
// jump straight to pricing: the draft from the last run is saved
console.log("tab click:", await tab.realClickText("Pricing", "*", true));
await new Promise(r => setTimeout(r, 3500));
const list = await tab.eval(() => {
  const els = [...document.querySelectorAll("input,textarea")].filter(e => e.offsetParent !== null);
  return els.map((e, i) => `${i}: ${e.tagName}/${e.type} ph="${e.placeholder}" max=${e.maxLength} val="${(e.value||"").slice(0,14)}" ctx="${((e.closest("label")?.innerText)||(e.parentElement?.parentElement?.innerText||"").split("\n")[0]||"").trim().slice(0,40)}"`);
});
console.log(list.join("\n"));
console.log("\nbuttons:", JSON.stringify(await tab.eval(() => [...document.querySelectorAll("button")].filter(b=>b.offsetParent!==null).map(b=>(b.innerText||"").trim()).filter(Boolean).slice(0,20))));
await tab.shot("C:/Users/abder/freelance-pack/tools/_pricing.png");
process.exit(0);
