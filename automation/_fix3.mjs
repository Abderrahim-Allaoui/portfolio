// _fix3.mjs — gallery images (upload + commit) + requirement question (inline)
import { fiverrTab } from "./cdp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "C:/Users/abder/freelance-pack";
const GIG = JSON.parse(readFileSync("./gig1.json", "utf8"));
const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=4&tab=gallery`, "manage_gigs");
await wait(5000);

// ---------------- gallery
const imgs = GIG.images.map(f => join(BASE, f));
console.log("uploading", imgs.length, "images...");
try { await tab.setFiles("input[type=file]", imgs); console.log("files set"); }
catch (e) { console.log("upload error:", e.message); }

for (const t of [4000, 8000, 14000]) {
  await wait(t === 4000 ? 4000 : 4000);
  const st = await tab.eval(() => ({
    previews: [...document.querySelectorAll("img")].filter(i => /cloudinary|attachment|upload/i.test(i.src)).length,
    txt: (document.body.innerText.match(/\d+ (?:of \d+ )?(?:images?|files?)/i) || [])[0] || "?",
    btns: [...document.querySelectorAll("button")].filter(b => b.offsetParent !== null)
      .map(b => (b.innerText || "").trim()).filter(x => /save|continue|upload|add/i.test(x)).slice(0, 6)
  }));
  console.log("  state:", JSON.stringify(st));
}
console.log("save&cont:", await tab.clickText("Save & Continue", "button"));
await wait(5000);
console.log("url:", await tab.eval(() => location.href));
try { await tab.shot(`${BASE}/tools/_gallery2.png`); } catch {}

// ---------------- requirements (inline flow)
await tab.goto(`${EDIT}?wizard=3&tab=requirements`);
await wait(5000);
console.log("\n--- requirements ---");
await tab.eval(() => {
  const b = [...document.querySelectorAll("button,a")].find(x => /add new question/i.test((x.innerText || "").trim()));
  if (b) b.click();
});
await wait(2000);
const after = await tab.eval(() => {
  const t = document.body.innerText;
  const i = t.toLowerCase().indexOf("your questions");
  return {
    text: t.slice(i, i + 600),
    inputs: [...document.querySelectorAll("input")].filter(e => e.offsetParent !== null).map(e => e.placeholder || e.type),
    textareas: [...document.querySelectorAll("textarea")].filter(e => e.offsetParent !== null).map(e => e.placeholder || e.className.slice(0, 30))
  };
});
console.log("after click:", JSON.stringify(after, null, 1).slice(0, 1500));
try { await tab.shot(`${BASE}/tools/_req.png`); } catch {}
process.exit(0);
