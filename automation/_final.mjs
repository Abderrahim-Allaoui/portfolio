// _final.mjs — scroll requirements + publish, find the controls
import { fiverrTab } from "./cdp.mjs";

const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const tab = await fiverrTab(`${EDIT}?wizard=3&tab=requirements`, "manage_gigs");
await new Promise(r => setTimeout(r, 4500));

// requirements: scroll down inside the page
for (const y of [0, 700, 1400, 2100]) {
  await tab.eval((yy) => {
    let best = null;
    for (const e of document.querySelectorAll("div,main,section")) {
      if (e.scrollHeight > e.clientHeight + 200 && e.clientHeight > 300) { best = e; break; }
    }
    (best || document.scrollingElement).scrollTop = yy;
  }, y);
  await new Promise(r => setTimeout(r, 900));
  const found = await tab.eval(() => {
    const out = [];
    for (const e of document.querySelectorAll("button,a")) {
      if (e.offsetParent === null) continue;
      const t = (e.innerText || "").trim();
      if (t && t.length < 50 && /add|question|requirement|publish|save/i.test(t)) out.push(t);
    }
    const tas = [...document.querySelectorAll("textarea")].filter(e => e.offsetParent !== null).length;
    return { out: [...new Set(out)], textareas: tas };
  });
  console.log(`scroll ${y}:`, JSON.stringify(found));
}

// publish page
await tab.goto(`${EDIT}?wizard=5&tab=publish`);
await new Promise(r => setTimeout(r, 4500));
for (const y of [0, 800, 1600]) {
  await tab.eval((yy) => {
    let best = null;
    for (const e of document.querySelectorAll("div,main,section")) {
      if (e.scrollHeight > e.clientHeight + 200 && e.clientHeight > 300) { best = e; break; }
    }
    (best || document.scrollingElement).scrollTop = yy;
  }, y);
  await new Promise(r => setTimeout(r, 900));
  const found = await tab.eval(() => {
    const out = [];
    for (const e of document.querySelectorAll("button,a")) {
      if (e.offsetParent === null) continue;
      const t = (e.innerText || "").trim();
      if (t && t.length < 60) out.push(t);
    }
    return [...new Set(out)].slice(-12);
  });
  console.log(`publish scroll ${y}:`, JSON.stringify(found));
}
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_pub_bottom.png"); } catch {}
process.exit(0);
