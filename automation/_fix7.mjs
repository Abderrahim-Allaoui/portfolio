// _fix7.mjs — add the 2 remaining gallery images (Images up to 3)
import { fiverrTab } from "./cdp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "C:/Users/abder/freelance-pack";
const GIG = JSON.parse(readFileSync("./gig1.json", "utf8"));
const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=4&tab=gallery`, "manage_gigs");
await wait(5000);

// find the "Images (up to 3)" block and its empty slots
const slots = await tab.eval(() => {
  // the images grid = the container right after the "Images (up to N)" heading
  const h = [...document.querySelectorAll("div,h1,h2,h3,h4,h5,h6,span,p")]
    .find(e => !e.children.length && /^Images \(up to/i.test((e.textContent || "").trim()));
  if (!h) return { err: "no Images heading" };
  let box = h.parentElement;
  for (let i = 0; i < 8 && box; i++) {
    const ins = [...box.querySelectorAll("input[type=file]")].filter(e => e.offsetParent !== null);
    if (ins.length) {
      ins.forEach((e, k) => e.setAttribute("data-slot", k));
      return { ins: ins.length, imgs: [...box.querySelectorAll("img")].length };
    }
    box = box.parentElement;
  }
  return { err: "no image inputs found" };
});
console.log("slots:", JSON.stringify(slots));

const n = slots.ins || 0;
const files = GIG.images.slice(1, 1 + n).map(f => join(BASE, f));
for (let i = 0; i < n; i++) {
  const sel = `[data-slot='${i}']`;
  const st = await tab.eval((s) => {
    const el = document.querySelector(s);
    if (!el) return "gone";
    el.setAttribute("data-t", "1");
    return "ok";
  }, sel);
  if (st !== "ok") { console.log("slot", i, st); continue; }
  try {
    await tab.setFiles(`[data-t='1']`, [files[i]]);
    console.log("slot", i, "->", files[i].split("/").pop());
  } catch (e) { console.log("slot", i, "err", e.message); }
  await wait(7000);
}

const after = await tab.eval(() => {
  const t = document.body.innerText;
  return {
    err: (t.match(/not supported[^\n]*/) || [])[0] || null,
    imgs: [...document.querySelectorAll("img")].filter(i => /cloudinary/.test(i.src) && !/profile_photo/.test(i.src)).length,
    body: (t.match(/Images \(up to \d+\)/) || [])[0]
  };
});
console.log("after:", JSON.stringify(after));
console.log("save:", await tab.clickText("Save", "button"));
await wait(4000);
try { await tab.shot(`${BASE}/tools/_gallery4.png`); } catch {}
process.exit(0);
