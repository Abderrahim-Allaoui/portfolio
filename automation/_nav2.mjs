import { fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=0&tab=general", "manage_gigs");
await new Promise(r => setTimeout(r, 3500));
const nav = await tab.eval(() => {
  const out = [];
  for (const e of document.querySelectorAll("a,button,li")) {
    const t = (e.innerText||"").trim();
    if (!t || t.length > 40) continue;
    if (/^(Overview|Pricing|Description & FAQ|Requirements|Gallery|Publish)\b/i.test(t))
      out.push({ tag: e.tagName, t: t.split("\n")[0], href: e.getAttribute("href"), cls: (e.className||"").toString().slice(0,50) });
  }
  return out;
});
console.log("nav:", JSON.stringify(nav, null, 1).slice(0, 2000));
const ck = await tab.eval(() => [...document.querySelectorAll("input[type=checkbox]")].filter(c=>c.offsetParent!==null)
  .map(c => { const l = c.closest("label")||c.parentElement; return (l?.innerText||"").trim().split("\n")[0]+"="+c.checked; }).filter(x=>x.endsWith("=true")));
console.log("checked:", ck.join(" "));
const tags = await tab.eval(() => [...document.querySelectorAll("*")].filter(e=>!e.children.length && /^B2B LEADS|LEAD GENERATION/i.test((e.textContent||"").trim())).map(e=>e.textContent.trim()));
console.log("tags chips:", JSON.stringify(tags));
process.exit(0);
