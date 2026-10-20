import { fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=0&tab=general", "manage_gigs");
await new Promise(r => setTimeout(r, 3500));
console.log("title ta:", await tab.eval(() => !!document.querySelector("textarea[maxlength='80']")));
console.log("cat     :", await tab.eval(() => [...document.querySelectorAll(".orca-combo-box.category-selector__control")].map(c=>(c.innerText||"").trim())));
// jump to pricing via the wizard nav
const nav = await tab.eval(() => {
  const el = [...document.querySelectorAll("a,button,li,span,div")].find(e => !e.children.length && (e.textContent||"").trim() === "Pricing");
  if (!el) return null; el.setAttribute("data-nav","1"); return el.outerHTML.slice(0,150);
});
console.log("nav:", nav);
console.log("click:", await tab.realClickText("Pricing", "*", true));
await new Promise(r => setTimeout(r, 3500));
console.log("url:", await tab.eval(() => location.href));
const list = await tab.eval(() => {
  const els = [...document.querySelectorAll("input,textarea,select")].filter(e => e.offsetParent !== null);
  return els.map((e,i) => `${i}: ${e.tagName}/${e.type||""} ph="${e.placeholder||""}" max=${e.maxLength} val="${(e.value||"").slice(0,14)}" ctx="${((e.closest("label")?.innerText)||(e.parentElement?.parentElement?.innerText||"").split("\n")[0]||"").trim().slice(0,32)}"`);
});
console.log(list.join("\n"));
process.exit(0);
