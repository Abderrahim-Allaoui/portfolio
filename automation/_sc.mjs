import { fiverrTab } from "./cdp.mjs";
const U = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=1&tab=pricing";
const tab = await fiverrTab(U, "manage_gigs");
await new Promise(r => setTimeout(r, 4500));
for (const y of [500, 900, 1300]) {
  await tab.eval((yy) => {
    // find the scrollable container and scroll it
    let best = null;
    for (const e of document.querySelectorAll("div,main,section")) {
      if (e.scrollHeight > e.clientHeight + 200 && e.clientHeight > 300) { best = e; break; }
    }
    (best || document.scrollingElement).scrollTop = yy;
  }, y);
  await new Promise(r => setTimeout(r, 1200));
  const top = await tab.eval(() => {
    let best = null;
    for (const e of document.querySelectorAll("div,main,section")) {
      if (e.scrollHeight > e.clientHeight + 200 && e.clientHeight > 300) { best = e; break; }
    }
    return (best || document.scrollingElement).scrollTop;
  });
  console.log("scrollTop now:", top);
  try { await tab.shot(`C:/Users/abder/freelance-pack/tools/_sc${y}.png`); } catch {}
}
process.exit(0);
