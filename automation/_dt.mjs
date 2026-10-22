import { fiverrTab } from "./cdp.mjs";
const U = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=1&tab=pricing";
const tab = await fiverrTab(U, "manage_gigs");
await new Promise(r => setTimeout(r, 4500));
await tab.eval(() => { const t = [...document.querySelectorAll("div,span,p")].find(e => !e.children.length && (e.textContent||"").trim() === "DELIVERY TIME"); if (t) t.scrollIntoView({block:"start"}); });
await new Promise(r => setTimeout(r, 1500));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_delivery.png"); } catch(e) { console.log("shot fail"); }
console.log("ok");
process.exit(0);
