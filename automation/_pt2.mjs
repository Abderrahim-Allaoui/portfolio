import { fiverrTab } from "./cdp.mjs";
const U = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=1&tab=pricing";
const tab = await fiverrTab(U, "manage_gigs");
await new Promise(r => setTimeout(r, 4000));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_pricing2.png"); } catch {}
const s = await tab.eval(() => {
  const t = document.body.innerText;
  const i = t.indexOf("Offer packages");
  return { txt: t.slice(i, i + 900) };
});
console.log(s.txt);
process.exit(0);
