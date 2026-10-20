// _fix4.mjs — gallery images (correct input) + requirement questions (real flow)
import { fiverrTab } from "./cdp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "C:/Users/abder/freelance-pack";
const GIG = JSON.parse(readFileSync("./gig1.json", "utf8"));
const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=4&tab=gallery`, "manage_gigs");
await wait(5000);

// ---------------- gallery: find the IMAGE input
const inputs = await tab.eval(() => [...document.querySelectorAll("input[type=file]")].map((e, i) => ({
  i, accept: e.accept || "(any)", multiple: e.multiple,
  vis: e.offsetParent !== null
})));
console.log("file inputs:", JSON.stringify(inputs));

const imgIdx = inputs.findIndex(x => /image|png|jpg|jpeg/i.test(x.accept));
console.log("image input index:", imgIdx);

if (imgIdx >= 0) {
  const imgs = GIG.images.map(f => join(BASE, f));
  const sel = await tab.eval((i) => {
    const el = document.querySelectorAll("input[type=file]")[i];
    if (!el) return null;
    el.setAttribute("data-img-input", "1");
    return "ok";
  }, imgIdx);
  console.log("select:", sel);
  try {
    await tab.setFiles("[data-img-input='1']", imgs);
    console.log("uploaded", imgs.length, "images");
  } catch (e) { console.log("upload error:", e.message); }
  await wait(9000);
  const st = await tab.eval(() => ({
    previews: [...document.querySelectorAll("img")].filter(i => /cloudinary/.test(i.src) && !/profile_photo/.test(i.src)).length,
    err: (document.body.innerText.match(/not supported[^\n]*/) || [])[0] || null
  }));
  console.log("after upload:", JSON.stringify(st));
  console.log("save:", await tab.clickText("Save", "button"));
  await wait(4000);
}

// ---------------- requirements
await tab.goto(`${EDIT}?wizard=3&tab=requirements`);
await wait(5000);
console.log("\n--- requirements ---");
for (let i = 0; i < GIG.requirements.length; i++) {
  const opened = await tab.eval(() => {
    const b = [...document.querySelectorAll("button,a")].find(x => /add new question/i.test((x.innerText || "").trim()));
    if (!b) return "no button";
    b.click();
    return "opened";
  });
  await wait(1500);
  if (opened !== "opened") { console.log("  add:", opened); break; }

  // fill the question input and the requirement textarea, then press Add
  const r = await tab.eval((pair) => {
    const ins = [...document.querySelectorAll("input")].filter(e => e.offsetParent !== null && e.type === "text");
    const tas = [...document.querySelectorAll("textarea")].filter(e => e.offsetParent !== null);
    const q = ins[ins.length - 1];
    const a = tas[tas.length - 1];
    if (q) {
      const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      s.call(q, pair[0]);
      q.dispatchEvent(new Event("input", { bubbles: true }));
      q.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (a) {
      const s = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
      s.call(a, pair[1]);
      a.dispatchEvent(new Event("input", { bubbles: true }));
      a.dispatchEvent(new Event("change", { bubbles: true }));
    }
    // press the "Add" button (the small one, not Save & Continue)
    const add = [...document.querySelectorAll("button")].find(b => {
      const t = (b.innerText || "").trim();
      return t === "Add" && b.offsetParent !== null;
    });
    if (add) { add.click(); return "added: " + pair[0].slice(0, 30); }
    return "filled but no Add button (q=" + !!q + " a=" + !!a + ")";
  }, GIG.requirements[i]);
  console.log("  req[" + i + "]:", r);
  await wait(1600);
}
console.log("save&cont:", await tab.clickText("Save & Continue", "button"));
await wait(4000);
console.log("REQ state:", await tab.eval(() => {
  const t = document.body.innerText;
  const i = t.indexOf("YOUR QUESTIONS");
  return t.slice(i, i + 300);
}));
try { await tab.shot(`${BASE}/tools/_req2.png`); } catch {}
process.exit(0);
