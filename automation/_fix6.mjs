// _fix6.mjs — look at the top of the gallery step
import { fiverrTab } from "./cdp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "C:/Users/abder/freelance-pack";
const GIG = JSON.parse(readFileSync("./gig1.json", "utf8"));
const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=4&tab=gallery`, "manage_gigs");
await wait(5000);

const sec = await tab.eval(() => {
  const heads = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,div,span")]
    .filter(e => !e.children.length && /^(Gallery|Video|Documents|Add a video|Add a thumbnail)/i.test((e.textContent || "").trim()));
  return heads.map(h => {
    const r = h.getBoundingClientRect();
    return { t: h.textContent.trim(), y: Math.round(r.top + window.scrollY) };
  });
});
console.log("sections:", JSON.stringify(sec));

// scroll to the very top of the inner container
await tab.eval(() => {
  let best = null;
  for (const e of document.querySelectorAll("div,main,section")) {
    if (e.scrollHeight > e.clientHeight + 200 && e.clientHeight > 300) { best = e; break; }
  }
  (best || document.scrollingElement).scrollTop = 0;
});
await wait(1200);
try { await tab.shot(`${BASE}/tools/_gallery_top.png`); } catch {}

// try input 3 with all 4 images, then read back the DOM for the file names
await tab.setFiles("input[type=file]:nth-of-type(1)", []).catch(() => {});
const idx = await tab.eval(() => {
  const els = [...document.querySelectorAll("input[type=file]")];
  const i = els.findIndex((e, k) => e.offsetParent !== null && k !== 0);
  if (i < 0) return -1;
  els[i].setAttribute("data-img", "1");
  return i;
});
console.log("chosen idx:", idx);
try { await tab.setFiles("[data-img='1']", GIG.images.map(f => join(BASE, f))); console.log("uploaded"); }
catch (e) { console.log("err", e.message); }
await wait(12000);
const after = await tab.eval(() => {
  const t = document.body.innerText;
  return {
    err: (t.match(/not supported[^\n]*/) || [])[0] || null,
    names: [...new Set([...document.querySelectorAll("img")].map(i => i.src).filter(s => /thumbnail|leadgen|portfolio|maps-scraper|output|code/.test(s)).map(s => s.split("/").pop().slice(0, 45)))],
    bodyHasGallery: /gallery/i.test(t)
  };
});
console.log("after:", JSON.stringify(after, null, 1));
try { await tab.shot(`${BASE}/tools/_gallery3.png`); } catch {}
process.exit(0);
