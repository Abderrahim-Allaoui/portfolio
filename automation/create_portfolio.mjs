// create_portfolio.mjs — create the 3 Fiverr portfolio projects via CDP.
//
// Fiverr portfolio attachments accept IMAGES ONLY (.jpg .png .gif .mp4 .avi),
// max 5 files, and the FIRST file becomes the thumbnail.
//
// Live-form gotchas (all found the hard way):
//  - the radio inputs are visibility:hidden and share name="item"; the real
//    UI is three custom dropdowns ("Select duration.", "MM", "YY").
//  - their option lists are lazily rendered -> open the dropdown first, then
//    click the option.
//  - the option cells are painted sibling divs, so click by visible text.
//  - the industry combobox only renders its options after real keystrokes;
//    the matching industry here is "Data Analytics".
//  - renaming a radio's `name` breaks the server-side parse. Never do that.
//
// Usage: node create_portfolio.mjs [1|2|3|all]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { Tab, fiverrTab } from "./cdp.mjs";

const data = JSON.parse(readFileSync("./projects.json", "utf8"));
const BASE = data.base;
const only = process.argv[2] || "all";
const NEW = "https://www.fiverr.com/users/allaouiabder/portfolio/new";

function ensureCdp() {
  try {
    const r = execFileSync("powershell", ["-ExecutionPolicy", "Bypass", "-File", "./ensure_opera_cdp.ps1"],
      { encoding: "utf8", timeout: 150000 });
    console.log("[cdp]", r.trim().split("\n").pop());
  } catch (e) { console.log("[cdp] restart failed:", String(e).slice(0, 160)); }
}

const setInput = (tab, sel, val) => tab.eval((s, v) => {
  const el = document.querySelector(s);
  if (!el) return "NOT FOUND " + s;
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return "ok " + s + " (" + v.length + " chars)";
}, sel, val);

const click = async (tab, txt, exact = true, wait = 900) => {
  const r = await tab.realClickText(txt, "*", exact);
  await new Promise(res => setTimeout(res, wait));
  return r;
};

// open a Fiverr dropdown, pick an option, close the list, then VERIFY the
// section actually shows the value. The option lists stay open otherwise and
// overlay the next section, which breaks every click after it.
async function pickDropdown(tab, openText, optionText, expect) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await tab.escape();
    await new Promise(r => setTimeout(r, 400));
    const open = await tab.realClickText(openText, "*", false);
    await new Promise(r => setTimeout(r, 1000));
    const pick = await tab.realClickText(optionText);
    await new Promise(r => setTimeout(r, 800));
    await tab.escape();
    await new Promise(r => setTimeout(r, 500));
    const ok = await tab.eval((e) => {
      const t = document.body.innerText;
      return t.includes(e);
    }, expect);
    console.log(`      [${attempt}] open=${open} pick=${pick} verify("${expect}")=${ok ? "OK" : "FAIL"}`);
    if (ok) return "OK " + expect;
  }
  return "FAILED " + expect;
}

// close an open option list: click the combobox again to toggle it, then
// click a neutral heading if it is still open.
async function closeLists(tab) {
  for (let i = 0; i < 3; i++) {
    const open = await tab.eval(() => {
      const opts = [...document.querySelectorAll("[role=dialog] div, [role=dialog] span, li")]
        .filter(e => e.offsetParent !== null && e.children.length === 0);
      return opts.length;
    });
    if (!open) return "closed";
    await tab.eval(() => {
      const cb = [...document.querySelectorAll('[role=combobox]')].find(b => {
        const i = b.querySelector("input");
        return i && i.value;
      });
      if (cb) { cb.scrollIntoView({ block: "center" }); cb.click(); }
    });
    await new Promise(r => setTimeout(r, 700));
    // still open -> click a neutral spot
    const still = await tab.eval(() => [...document.querySelectorAll("[role=dialog] div, [role=dialog] span, li")]
      .filter(e => e.offsetParent !== null && e.children.length === 0).length);
    if (still) {
      await tab.realClickText("Project name", "*", false);
      await new Promise(r => setTimeout(r, 700));
    }
  }
  return "closed";
}

async function pickFromCombobox(tab, query, optionPrefixes) {
  const prefixes = Array.isArray(optionPrefixes) ? optionPrefixes : [optionPrefixes];
  // The combobox input can have a 0x0 rect (Fiverr paints its own box), so
  // locate it through the [role=combobox] wrapper, not by geometry.
  const sel = await tab.eval(() => {
    const boxes = [...document.querySelectorAll('[role=combobox]')];
    for (const b of boxes) {
      const inp = b.querySelector("input");
      if (!inp) continue;
      if (inp.value) continue;                 // skip already-filled ones
      inp.setAttribute("data-cb-target", "1");
      return 'input[data-cb-target="1"]';
    }
    const ph = document.querySelector('input[placeholder*="industry" i]');
    if (ph) { ph.setAttribute("data-cb-target", "1"); return 'input[data-cb-target="1"]'; }
    return null;
  });
  if (!sel) return "combobox not found";
  await tab.typeText(sel, query);
  await new Promise(r => setTimeout(r, 1800));
  const r = await tab.eval((pres) => {
    const all = [...document.querySelectorAll("[role=dialog] div, [role=dialog] span, li, div")]
      .filter(e => e.offsetParent !== null && e.children.length === 0)
      .map(e => (e.textContent || "").trim());
    for (const pre of pres) {
      const hit = all.find(t => t.toLowerCase().startsWith(pre.toLowerCase()));
      if (!hit) continue;
      const el = [...document.querySelectorAll("[role=dialog] div, [role=dialog] span, li, div")]
        .find(e => e.offsetParent !== null && e.children.length === 0 && (e.textContent || "").trim() === hit);
      el.click();
      return "picked " + hit;
    }
    return "option not found (" + pres.join("/") + ") - visible: " + [...new Set(all)].slice(0, 10).join(" | ");
  }, prefixes);
  await new Promise(res => setTimeout(res, 900));
  return r;
}

async function pickIndustry(tab, query) {
  return pickFromCombobox(tab, query, "Data Analytics");
}

async function createProject(p) {
  ensureCdp();
  const tab = await fiverrTab();
  await tab.goto(NEW);
  await new Promise(r => setTimeout(r, 4000));

  console.log(`\n===== PROJECT ${p.n} =====`);
  console.log("title    :", await setInput(tab, "input[name=title]", p.title));
  console.log("desc     :", await setInput(tab, "textarea[name=overview]", p.desc));
  console.log("cost     :", await setInput(tab, "input[name=cost]", p.cost));
  // industry first, then close its option list, then the three dropdowns
  // (picking the industry re-renders and resets the dropdowns otherwise)
  console.log("industry :", await pickFromCombobox(tab, "data", ["Data Analytics"]));
  console.log("close    :", await closeLists(tab));
  console.log("duration :", await pickDropdown(tab, "Select duration.", "1-7 days", "1-7 days"));
  console.log("month    :", await pickDropdown(tab, "MM", "October", "October"));
  console.log("year     :", await pickDropdown(tab, "YY", "2026", "2026"));

  const files = p.files.map(f => join(BASE, f));
  try {
    await tab.setFiles("input[type=file][name=attachments]", files);
    console.log("files    :", files.length, "uploaded");
  } catch (e) { console.log("files    : UPLOAD ERROR", e.message); }
  await new Promise(r => setTimeout(r, 4000));

  const state = await tab.eval(() => {
    const t = document.body.innerText;
    const g = (re) => (t.match(re) || [])[0] || "-";
    return {
      title: g(/\d+\/50 characters/),
      desc: g(/\d+\/1400 characters/),
      duration: g(/Project duration\s*\n([^\n]+)/),
      month: g(/Project started on\s*\n([^\n]+)/),
      files: document.querySelector("input[type=file]")?.files?.length ?? -1
    };
  });
  console.log("state    :", JSON.stringify(state));

  await tab.shot(`${BASE}/tools/_p${p.n}_filled.png`);

  console.log("continue :", await tab.clickText("Continue", "button"));
  await new Promise(r => setTimeout(r, 5000));

  const after = await tab.eval(() => ({ url: location.href, text: document.body.innerText.slice(0, 1200) }));
  console.log("url      :", after.url);
  console.log("text     :\n" + after.text.slice(0, 900));
  await tab.shot(`${BASE}/tools/_p${p.n}_step2.png`);

  // ---------------- STEP 2: project category + publish
  if (/STEP 2 OF 2/.test(after.text)) {
    console.log("category :", await pickFromCombobox(tab, "data", p.categories || ["Data Analytics", "Data Entry", "Data Engineering"]));
    await tab.escape();
    await new Promise(r => setTimeout(r, 700));
    await tab.shot(`${BASE}/tools/_p${p.n}_step2b.png`);

    const st2 = await tab.eval(() => document.body.innerText.slice(0, 700));
    console.log("step2    :\n" + st2);

    console.log("publish  :", await tab.clickText("Publish project", "button"));
    await new Promise(r => setTimeout(r, 6000));
    const fin = await tab.eval(() => ({ url: location.href, text: document.body.innerText.slice(0, 900) }));
    console.log("final url:", fin.url);
    console.log("final    :\n" + fin.text.slice(0, 700));
    await tab.shot(`${BASE}/tools/_p${p.n}_done.png`);
  }
  return tab;
}

const list = data.projects.filter(p => only === "all" || String(p.n) === only);
for (const p of list) {
  try { await createProject(p); }
  catch (e) { console.log("FAILED:", String(e).slice(0, 300)); }
  await new Promise(r => setTimeout(r, 2000));
}
console.log("\nDONE");
process.exit(0);
