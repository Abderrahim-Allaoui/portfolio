// _verify.mjs — final state of the gig draft
import { fiverrTab } from "./cdp.mjs";

const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=0&tab=general`, "manage_gigs");
await wait(4500);

const steps = [["general", 0], ["pricing", 1], ["faq_description", 2], ["requirements", 3], ["gallery", 4]];

for (const [t, w] of steps) {
  await tab.goto(`${EDIT}?wizard=${w}&tab=${t}`);
  await wait(4500);
  const s = await tab.eval(() => {
    const eds = [...document.querySelectorAll("[contenteditable=true]")].filter(e => e.offsetParent !== null);
    const tas = [...document.querySelectorAll("textarea")].filter(e => e.offsetParent !== null);
    const files = document.querySelectorAll("input[type=file]")[0];
    return {
      title: document.querySelector("textarea[maxlength='80']")?.value,
      desc: eds[0]?.innerText?.slice(0, 60) || "(none)",
      editors: eds.length,
      textareas: tas.length,
      taValues: tas.map(x => (x.value || "").slice(0, 40)),
      imgs: [...document.querySelectorAll("img")].filter(i => /cloudinary|fiverr/.test(i.src) && !/profile_photo/.test(i.src)).length
    };
  });
  console.log(`\n### ${t}`);
  console.log("  title    :", s.title);
  console.log("  desc     :", JSON.stringify(s.desc));
  console.log("  editors  :", s.editors, "| textareas:", s.textareas, JSON.stringify(s.taValues).slice(0, 200));
  console.log("  imgs     :", s.imgs);
}
process.exit(0);
