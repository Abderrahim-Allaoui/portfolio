// debug_click2.mjs — find the VISIBLE month cell and click it
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/portfolio/new");
await new Promise(r => setTimeout(r, 3500));

const info = await tab.eval(() => {
  const cands = [...document.querySelectorAll("*")].filter(e => {
    if (e.children.length) return false;
    const t = (e.textContent || "").trim();
    if (t !== "October") return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  return cands.slice(0, 6).map(e => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return {
      tag: e.tagName, role: e.getAttribute("role"), cls: (e.className || "").toString().slice(0, 40),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      vis: cs.visibility, op: cs.opacity,
      parentRole: e.parentElement?.getAttribute("role"),
      parentTag: e.parentElement?.tagName,
      parentCls: (e.parentElement?.className || "").toString().slice(0, 40),
      parentHTML: e.parentElement?.outerHTML.slice(0, 260)
    };
  });
});
console.log(JSON.stringify(info, null, 1).slice(0, 4000));
process.exit(0);
