// _fix10.mjs — set the 3 requirement questions correctly
import { fiverrTab } from "./cdp.mjs";
import { readFileSync } from "node:fs";

const GIG = JSON.parse(readFileSync("./gig1.json", "utf8"));
const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=3&tab=requirements`, "manage_gigs");
await wait(5000);

const res = await tab.eval((qs) => {
  const spans = [...document.querySelectorAll("span._45044b, span[class*=_45044b]")].filter(e => e.offsetParent !== null);
  const out = [];
  spans.slice(0, qs.length).forEach((el, i) => {
    const q = qs[i];
    el.focus();
    el.textContent = q;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    out.push(el.textContent.slice(0, 40));
  });
  return { n: spans.length, out };
}, GIG.requirements.map(r => r[0]));
console.log("set:", JSON.stringify(res, null, 1));

await wait(1200);
console.log("save:", await tab.clickText("Save", "button"));
await wait(3500);
const check = await tab.eval(() => [...document.querySelectorAll("span[class*=_45044b]")].filter(e => e.offsetParent !== null).map(e => e.textContent.slice(0, 50)));
console.log("cards now:", JSON.stringify(check, null, 1));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_req_ok.png"); } catch {}
process.exit(0);
