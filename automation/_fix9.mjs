// _fix9.mjs — inspect a requirement card, then fix the 3 questions
import { fiverrTab } from "./cdp.mjs";
import { readFileSync } from "node:fs";

const GIG = JSON.parse(readFileSync("./gig1.json", "utf8"));
const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=3&tab=requirements`, "manage_gijs", "manage_gigs");
await wait(5000);

const card = await tab.eval(() => {
  const t = [...document.querySelectorAll("div")].find(d => /FREE TEXT/.test(d.innerText || "") && (d.innerText || "").length < 300);
  if (!t) return { err: "no card" };
  return { html: t.outerHTML.slice(0, 1200) };
});
console.log("CARD HTML:\n" + card.html);
process.exit(0);
