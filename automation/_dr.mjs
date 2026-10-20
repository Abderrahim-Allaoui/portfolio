import { fiverrTab } from "./cdp.mjs";
const U = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=1&tab=pricing";
const tab = await fiverrTab(U, "manage_gigs");
await new Promise(r => setTimeout(r, 4000));
const h = await tab.eval(() => {
  const row = [...document.querySelectorAll("tr")].find(r => (r.innerText||"").trim().split("\n")[0].trim() === "DELIVERY TIME");
  if (!row) return "no row";
  return row.innerHTML.slice(0, 2200);
});
console.log(h);
process.exit(0);
