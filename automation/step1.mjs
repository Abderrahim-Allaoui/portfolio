// step1.mjs — dashboard checklist + go to profile page
import { Tab } from "./cdp.mjs";

const tab = await Tab.open(/fiverr/);
console.log("URL:", tab.info.url);

const dash = await tab.eval(() => {
  const t = document.body.innerText;
  const i = t.indexOf("Complete these steps");
  return t.slice(i, i + 1800);
});
console.log("=== DASHBOARD CHECKLIST ===\n" + dash);

// find profile link
const links = await tab.eval(() => [...document.querySelectorAll("a[href*='/users/']")]
  .map(a => a.getAttribute("href")).filter((v, i, s) => s.indexOf(v) === i).slice(0, 12));
console.log("\n=== profile-ish links ===\n" + links.join("\n"));

await tab.shot("C:/Users/abder/freelance-pack/tools/_fiverr_dash.png");
process.exit(0);
