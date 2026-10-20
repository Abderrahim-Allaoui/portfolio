// check.mjs — open the Fiverr tab, report login state + key elements
import { Tab, listTargets } from "./cdp.mjs";

const targets = await listTargets();
const fiv = targets.filter(t => t.url.includes("fiverr"));
console.log("Fiverr targets:", fiv.map(t => t.url).join(" | ") || "NONE");

if (!fiv.length) { console.log("no fiverr tab"); process.exit(0); }

const tab = await Tab.open(/fiverr/);
console.log("\nURL:", tab.info.url, "\nTITLE:", tab.info.title);

const state = await tab.eval(() => ({
  url: location.href,
  title: document.title,
  hasLogin: /Sign in|Log in/.test(document.body.innerText.slice(0, 800)),
  hasDashboard: /seller_dashboard|Dashboard|Overview|Gigs|Earnings/.test(document.body.innerText.slice(0, 3000)),
  head: document.body.innerText.slice(0, 700)
}));
console.log("\n=== STATE ===");
console.log(JSON.stringify(state, null, 1));

await tab.shot("C:/Users/abder/freelance-pack/tools/_fiverr_state.png");
console.log("\nscreenshot -> tools/_fiverr_state.png");
process.exit(0);
