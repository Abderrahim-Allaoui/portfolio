import { Tab, fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/portfolio/new");
await new Promise(r => setTimeout(r, 4000));
console.log("url:", await tab.eval(() => location.href));
console.log("has form:", await tab.eval(() => !!document.querySelector("form")));
console.log("form names:", await tab.eval(() => [...document.querySelectorAll("form")].map(f => f.getAttribute("name") || f.getAttribute("id") || "(anon)")));
console.log("radios:", await tab.eval(() => document.querySelectorAll("input[type=radio]").length));
console.log("visible texts:", await tab.eval(() => {
  const out = [];
  for (const e of document.querySelectorAll("div,span,label")) {
    if (e.children.length) continue;
    const t = (e.textContent||"").trim();
    if (!t || t.length > 18) continue;
    const r = e.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) out.push(t);
  }
  return [...new Set(out)].slice(0, 40);
}));
await tab.shot("C:/Users/abder/freelance-pack/tools/_form_look.png");
console.log("shot saved");
process.exit(0);
