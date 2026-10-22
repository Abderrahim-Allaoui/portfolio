// _final_check.mjs — final state of every wizard step
import { fiverrTab } from "./cdp.mjs";

const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=0&tab=general`, "manage_gigs");
await wait(4500);

for (const [t, w] of [["general", 0], ["pricing", 1], ["faq_description", 2], ["requirements", 3], ["gallery", 4]]) {
  await tab.goto(`${EDIT}?wizard=${w}&tab=${t}`);
  await wait(4500);
  const s = await tab.eval(() => {
    const eds = [...document.querySelectorAll("[contenteditable=true]")].filter(e => e.offsetParent !== null);
    const tas = [...document.querySelectorAll("textarea")].filter(e => e.offsetParent !== null);
    return {
      title: document.querySelector("textarea[maxlength='80']")?.value,
      desc: (eds[0]?.innerText || "").slice(0, 70),
      editors: eds.length,
      taCount: tas.length,
      taVals: tas.map(x => (x.value || "").slice(0, 42)),
      galleryImgs: [...document.querySelectorAll("img")].filter(i => /cloudinary/.test(i.src) && !/profile_photo/.test(i.src)).length,
      crumbs: [...document.querySelectorAll("span.nav-crumb")].map(e => (e.innerText || "").trim())
    };
  });
  console.log(`\n### ${t}  crumbs=${JSON.stringify(s.crumbs)}`);
  if (s.title) console.log("  title   :", s.title);
  if (s.desc) console.log("  desc    :", JSON.stringify(s.desc));
  console.log("  editors :", s.editors, "| textareas:", s.taCount);
  if (s.taVals.length) console.log("  values  :", JSON.stringify(s.taVals));
  console.log("  gallery :", s.galleryImgs, "cloudinary imgs");
}
process.exit(0);
