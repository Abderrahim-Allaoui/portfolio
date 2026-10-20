import { fiverrTab } from "./cdp.mjs";
const BASEU = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=0&tab=";
const tab = await fiverrTab(BASEU + "pricing", "manage_gigs");
await new Promise(r => setTimeout(r, 4000));
console.log("url:", await tab.eval(() => location.href));
const list = await tab.eval(() => {
  const els = [...document.querySelectorAll("input,textarea,select")].filter(e => e.offsetParent !== null);
  return els.map((e,i) => `${i}: ${e.tagName}/${e.type||""} ph="${e.placeholder||""}" max=${e.maxLength} val="${(e.value||"").slice(0,12)}" ctx="${((e.closest("label")?.innerText)||(e.parentElement?.parentElement?.innerText||"").split("\n")[0]||"").trim().slice(0,30)}"`);
});
console.log(list.join("\n"));
process.exit(0);
