// _steps.mjs — screenshot + text dump of every wizard step
import { fiverrTab } from "./cdp.mjs";

const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const tabs = [
  ["general", 1], ["pricing", 1], ["faq_description", 2],
  ["requirements", 2], ["gallery", 2], ["publish", 5]
];

const tab = await fiverrTab(`${EDIT}?wizard=1&tab=general`, "manage_gigs");
await new Promise(r => setTimeout(r, 3500));

for (const [t, w] of tabs) {
  await tab.goto(`${EDIT}?wizard=${w}&tab=${t}`);
  await new Promise(r => setTimeout(r, 5000));
  const info = await tab.eval(() => ({
    url: location.href,
    tas: [...document.querySelectorAll("textarea")].filter(e => e.offsetParent !== null)
      .map((e, i) => `${i}: max=${e.maxLength} ph="${(e.placeholder || "").slice(0, 40)}"`),
    ceds: [...document.querySelectorAll("[contenteditable=true]")].filter(e => e.offsetParent !== null)
      .map((e, i) => `${i}: tag=${e.tagName} ph="${(e.getAttribute("data-placeholder") || e.getAttribute("placeholder") || "").slice(0, 45)}"`),
    btns: [...document.querySelectorAll("button,a")].filter(b => b.offsetParent !== null)
      .map(b => (b.innerText || "").trim()).filter(t => t && t.length < 40).slice(0, 10)
  }));
  console.log(`\n### ${t} (${info.url})`);
  console.log("  textareas:", JSON.stringify(info.tas));
  console.log("  editables:", JSON.stringify(info.ceds));
  console.log("  buttons  :", JSON.stringify([...new Set(info.btns)]));
  try { await tab.shot(`C:/Users/abder/freelance-pack/tools/_step_${t}.png`); } catch {}
}
process.exit(0);
