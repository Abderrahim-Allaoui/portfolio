// _fix11.mjs — replace the duplicated gallery image with the code screenshot
import { fiverrTab } from "./cdp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "C:/Users/abder/freelance-pack";
const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=4&tab=gallery`, "manage_gijs", "manage_gigs");
await wait(5000);

const dots = await tab.eval(() => {
  const out = [];
  for (const e of document.querySelectorAll("button,a,i,span,div")) {
    if (e.offsetParent === null) continue;
    const t = (e.innerText || "").trim();
    const isIcon = e.tagName === "I" || (e.querySelector("svg") && t.length < 4);
    if (!isIcon && t !== "...") continue;
    // only the ones inside the Images grid
    const grid = e.closest("[class*=gallery], [class*=image], [class*=grid], [class*=item]");
    if (!grid) continue;
    out.push({ tag: e.tagName, t, cls: (e.className || "").toString().slice(0, 40) });
  }
  return out.slice(0, 10);
});
console.log("icons:", JSON.stringify(dots));

// click the menu of the SECOND image card
const opened = await tab.eval(() => {
  const cards = [...document.querySelectorAll("img")].filter(i => /cloudinary/.test(i.src) && !/profile_photo/.test(i.src))
    .map(i => i.closest("div[class]")).filter(Boolean);
  // find all "..." buttons and pick the 2nd
  const all = [...document.querySelectorAll("button,i,span,a")].filter(e => e.offsetParent !== null && (e.innerText || "").trim() === "...");
  const m = all[all.length - 1];
  if (!m) return "no dots";
  m.click();
  return "clicked " + all.length + " dots";
});
console.log("menu:", opened);
await wait(1500);
const opts = await tab.eval(() => [...document.querySelectorAll("button,a,li")]
  .filter(e => e.offsetParent !== null)
  .map(e => (e.innerText || "").trim())
  .filter(t => t && t.length < 30 && /delete|remove|edit|replace|change/i.test(t)));
console.log("menu options:", JSON.stringify([...new Set(opts)]));
process.exit(0);
