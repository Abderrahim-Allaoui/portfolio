import { fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/manage_gigs", "manage_gigs");
await new Promise(r => setTimeout(r, 2500));
await tab.shot("C:/Users/abder/freelance-pack/tools/_gigs_list.png");
const rows = await tab.eval(() => {
  const out = [];
  for (const e of document.querySelectorAll("tr, [class*=gig-item], [class*=gig-item-row], [class*=row]")) {
    const t = (e.innerText||"").trim().replace(/\n+/g," | ");
    if (/build verified/i.test(t) && t.length < 400) out.push({ cls: (e.className||"").toString().slice(0,60), t: t.slice(0,160) });
  }
  return out.slice(0,6);
});
console.log(JSON.stringify(rows, null, 1).slice(0, 2000));
process.exit(0);
