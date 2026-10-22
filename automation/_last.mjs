// _last.mjs — final dashboard + gig list state
import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/seller_dashboard", "fiverr");
await wait(4500);
const d = await tab.eval(() => {
  const t = document.body.innerText;
  const i = t.indexOf("Profile Strength");
  return {
    strength: (t.match(/Profile Strength\s*(\d+)\s*\/\s*(\d+)/) || []).slice(1).join("/"),
    visible: /not visible yet/i.test(t) ? "NOT VISIBLE (needs ID verification)" : "visible",
    draft: (t.match(/DRAFT\s*\((\d+)\)/) || [])[1] || "?",
    text: t.slice(i, i + 300)
  };
});
console.log("dashboard:", JSON.stringify(d, null, 1));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_dashboard_final.png"); } catch {}
process.exit(0);
