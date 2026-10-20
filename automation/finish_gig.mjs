// finish_gig.mjs — fill Description + FAQ + Requirements, then publish.
//
// The gig draft already has: title, category (Data -> Data Scraping), metadata,
// 3 packages (names/descriptions/prices/delivery/revisions), 4 gallery images.
// What is left is the rich-text description, the FAQ and the buyer questions.
//
// Usage: node finish_gig.mjs
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { Tab, fiverrTab } from "./cdp.mjs";

const BASE = "C:/Users/abder/freelance-pack";
const GIG = JSON.parse(readFileSync("./gig1.json", "utf8"));
const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const url = (t) => `${EDIT}?wizard=${({ general: 0, pricing: 1, faq_description: 2, requirements: 3, gallery: 4, publish: 5 })[t]}&tab=${t}`;

function ensureCdp() {
  try {
    const r = execFileSync("powershell", ["-ExecutionPolicy", "Bypass", "-File", "./ensure_opera_cdp.ps1"],
      { encoding: "utf8", timeout: 150000 });
    console.log("[cdp]", r.trim().split("\n").pop());
  } catch (e) { console.log("[cdp] failed:", String(e).slice(0, 120)); }
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// type into a rich-text editor (contenteditable) the way a human would
async function typeRich(tab, index, text) {
  const r = await tab.eval((i, t) => {
    const eds = [...document.querySelectorAll("[contenteditable=true]")].filter(e => e.offsetParent !== null);
    const el = eds[i];
    if (!el) return "NO EDITABLE " + i + " (have " + eds.length + ")";
    el.focus();
    el.click();
    // clear
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("delete");
    // insert line by line so the editor keeps its block structure
    const lines = t.split("\n");
    lines.forEach((ln, k) => {
      document.execCommand("insertText", false, ln);
      if (k < lines.length - 1) document.execCommand("insertLineBreak");
    });
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return "typed " + t.length + " chars";
  }, index, text);
  await wait(600);
  return r;
}

(async () => {
  ensureCdp();
  const tab = await fiverrTab(url("general"), "manage_gigs");
  await wait(4000);

  // ================= STEP 3 : DESCRIPTION =================
  console.log("=== STEP 3 DESCRIPTION & FAQ ===");
  await tab.goto(url("faq_description"));
  await wait(5000);
  console.log("desc :", await typeRich(tab, 0, GIG.description));

  // FAQ: find the "add FAQ" control and build the pairs
  const faqBtns = await tab.eval(() => [...document.querySelectorAll("button,a")]
    .filter(b => b.offsetParent !== null)
    .map(b => (b.innerText || "").trim())
    .filter(t => /faq|question|add/i.test(t)).slice(0, 8));
  console.log("faq buttons:", JSON.stringify(faqBtns));

  // the FAQ rows are usually inputs + a second rich editor each
  console.log("inputs  :", await tab.eval(() => [...document.querySelectorAll("input")].filter(e => e.offsetParent !== null)
    .map((e, i) => `${i}: ph="${e.placeholder || ""}"`).join(" | ")));

  // add FAQ rows
  for (let i = 0; i < GIG.faq.length; i++) {
    const added = await tab.eval(() => {
      const bs = [...document.querySelectorAll("button,a")].filter(x => /add\s*faq/i.test((x.innerText || "").trim()));
      if (!bs.length) return "no add-faq button";
      bs[bs.length - 1].click();
      return "clicked add";
    });
    if (added !== "clicked add") { console.log("  add faq:", added); break; }
    await wait(1300);
    const ok = await tab.eval((pair, n) => {
      const eds = [...document.querySelectorAll("[contenteditable=true]")].filter(e => e.offsetParent !== null);
      const qIn = [...document.querySelectorAll("input")].filter(e => e.offsetParent !== null && e.type === "text");
      const target = qIn[qIn.length - 1];
      const ans = eds[eds.length - 1];
      if (!target || !ans) return "missing q/a (inputs=" + qIn.length + " eds=" + eds.length + ")";
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setter.call(target, pair[0]);
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
      ans.focus();
      document.execCommand("insertText", false, pair[1]);
      ans.dispatchEvent(new Event("input", { bubbles: true }));
      return "faq " + n + " ok";
    }, GIG.faq[i], i);
    console.log("  faq[" + i + "]:", ok);
    await wait(800);
  }
  await wait(800);
  console.log("save  :", await tab.clickText("Save", "button"));
  await wait(3500);

  // ================= STEP 4 : REQUIREMENTS =================
  console.log("\n=== STEP 4 REQUIREMENTS ===");
  await tab.goto(url("requirements"));
  await wait(5000);
  for (let i = 0; i < GIG.requirements.length; i++) {
    const r = await tab.eval(() => {
      const b = [...document.querySelectorAll("button,a")].find(x => /add new question/i.test((x.innerText || "").trim()));
      if (b) { b.click(); return "added"; }
      return "no add button";
    });
    await wait(1200);
    const filled = await tab.eval((qq) => {
      const tas = [...document.querySelectorAll("textarea")].filter(e => e.offsetParent !== null);
      const t = tas[tas.length - 1];
      if (!t) return "no textarea (" + tas.length + ")";
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(t, qq);
      t.dispatchEvent(new Event("input", { bubbles: true }));
      t.dispatchEvent(new Event("change", { bubbles: true }));
      return "filled: " + qq.slice(0, 38);
    }, GIG.requirements[i]);
    console.log("  req[" + i + "]:", r, "|", filled);
    await wait(700);
  }
  console.log("save  :", await tab.clickText("Save", "button"));
  await wait(3000);

  // ================= STEP 6 : PUBLISH =================
  console.log("\n=== STEP 6 PUBLISH ===");
  await tab.goto(url("publish"));
  await wait(5000);
  const pub = await tab.eval(() => {
    const out = [];
    for (const e of document.querySelectorAll("button,a,span,div")) {
      if (e.offsetParent === null) continue;
      const t = (e.innerText || "").trim();
      if (t && t.length < 45 && /publish|submit|go live|activate/i.test(t)) out.push(e.tagName + ":" + t);
    }
    return [...new Set(out)].slice(0, 12);
  });
  console.log("publish ctas:", JSON.stringify(pub));
  console.log("click  :", await tab.clickText("Publish gig", "button,a,span,div"));
  await wait(6000);
  console.log("url    :", await tab.eval(() => location.href));
  const t = await tab.eval(() => document.body.innerText);
  const i = t.search(/publish|created|visible|verif/i);
  console.log("text   :\n" + t.slice(Math.max(0, i - 150), i + 800));
  try { await tab.shot(`${BASE}/tools/_gig1_publish.png`); } catch {}
  process.exit(0);
})();
