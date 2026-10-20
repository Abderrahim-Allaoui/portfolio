// _fix8.mjs — swap requirement question/answer + verify gallery
import { fiverrTab } from "./cdp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "C:/Users/abder/freelance-pack";
const GIG = JSON.parse(readFileSync("./gig1.json", "utf8"));
const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=3&tab=requirements`, "manage_gigs");
await wait(5000);

// remove the 3 existing cards, then re-add with the right order
console.log("removing old cards...");
const removed = await tab.eval(() => {
  // each card has a "..." menu with a delete option
  const menus = [...document.querySelectorAll("button,a")].filter(b => b.offsetParent !== null && (b.innerText || "").trim() === "...");
  if (!menus.length) return "no menus";
  menus[0].click();
  return "opened menu";
});
console.log("menu:", removed);
await wait(1200);
const del = await tab.eval(() => {
  const b = [...document.querySelectorAll("button,a")].filter(x => x.offsetParent !== null)
    .find(x => /^(delete|remove)$/i.test((x.innerText || "").trim()));
  if (!b) return "no delete; options=" + [...document.querySelectorAll("button,a")].filter(x => x.offsetParent !== null).map(x => (x.innerText || "").trim()).filter(Boolean).slice(-8).join("|");
  b.click();
  return "deleted";
});
console.log("delete:", del);
await wait(1500);
console.log("cards left:", await tab.eval(() => document.body.innerText.match(/FREE TEXT/g)?.length || 0));
process.exit(0);
