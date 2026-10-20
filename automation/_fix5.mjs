// _fix5.mjs — find the image upload input on the gallery step
import { fiverrTab } from "./cdp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "C:/Users/abder/freelance-pack";
const GIG = JSON.parse(readFileSync("./gig1.json", "utf8"));
const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=4&tab=gallery`, "manage_gigs");
await wait(5000);

const ctx = await tab.eval(() => [...document.querySelectorAll("input[type=file]")].map((e, i) => {
  let p = e.parentElement, head = "";
  for (let k = 0; k < 8 && p; k++) {
    const t = (p.innerText || "").trim().split("\n").filter(Boolean);
    if (t.length) { head = t.slice(0, 3).join(" | ").slice(0, 90); break; }
    p = p.parentElement;
  }
  return { i, vis: e.offsetParent !== null, head };
}));
console.log("inputs:", JSON.stringify(ctx, null, 1));

// try each visible input with ONE png and see which complains
for (const c of ctx.filter(x => x.vis)) {
  await tab.goto(`${EDIT}?wizard=4&tab=gallery`);
  await wait(4000);
  const ok = await tab.eval((i) => {
    const el = document.querySelectorAll("input[type=file]")[i];
    if (!el) return "gone";
    el.setAttribute("data-t", "1");
    return "ok";
  }, c.i);
  if (ok !== "ok") { console.log(c.i, ok); continue; }
  try { await tab.setFiles("[data-t='1']", [join(BASE, GIG.images[0])]); }
  catch (e) { console.log(c.i, "err", e.message); continue; }
  await wait(6000);
  const res = await tab.eval(() => ({
    err: (document.body.innerText.match(/not supported[^\n]*/) || [])[0] || null,
    previews: [...document.querySelectorAll("img")].filter(x => /cloudinary/.test(x.src) && !/profile_photo/.test(x.src)).length
  }));
  console.log(`input ${c.i} [${c.head.slice(0, 40)}] -> err=${res.err} previews=${res.previews}`);
  if (!res.err && res.previews > 2) { console.log(">>> WINNER input", c.i); break; }
}
process.exit(0);
