// _tabs.mjs — find the wizard tab URLs
import { fiverrTab } from "./cdp.mjs";

const U = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=1&tab=pricing";
const tab = await fiverrTab(U, "manage_gigs");
await new Promise(r => setTimeout(r, 4000));

const nav = await tab.eval(() => {
  const out = [];
  for (const e of document.querySelectorAll("a,button,li,div,span")) {
    const t = (e.innerText || "").trim();
    if (!t || t.length > 30) continue;
    if (!/^(Overview|Pricing|Description|Requirements|Gallery|Publish)\b/i.test(t)) continue;
    out.push({
      tag: e.tagName,
      t: t.replace(/\n+/g, " | "),
      href: e.getAttribute("href"),
      cls: (e.className || "").toString().slice(0, 55),
      onclick: e.getAttribute("onclick"),
      data: JSON.stringify(Object.assign({}, e.dataset || {})).slice(0, 90)
    });
  }
  return out;
});
console.log(JSON.stringify(nav, null, 1).slice(0, 3000));
process.exit(0);
