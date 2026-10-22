// _shots.mjs — screenshots of gallery + requirements
import { fiverrTab } from "./cdp.mjs";
const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=4&tab=gallery`, "manage_gigs");
await wait(5000);
await tab.eval(() => {
  let best = null;
  for (const e of document.querySelectorAll("div,main,section")) {
    if (e.scrollHeight > e.clientHeight + 200 && e.clientHeight > 300) { best = e; break; }
  }
  (best || document.scrollingElement).scrollTop = 250;
});
await wait(1200);
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_gal_final.png"); } catch {}

await tab.goto(`${EDIT}?wizard=3&tab=requirements`);
await wait(5000);
await tab.eval(() => {
  let best = null;
  for (const e of document.querySelectorAll("div,main,section")) {
    if (e.scrollHeight > e.clientHeight + 200 && e.clientHeight > 300) { best = e; break; }
  }
  (best || document.scrollingElement).scrollTop = 500;
});
await wait(1200);
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_req_final.png"); } catch {}
console.log("ok");
process.exit(0);
