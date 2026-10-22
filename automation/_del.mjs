import { fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/manage_gigs", "manage_gigs");
await new Promise(r => setTimeout(r, 2500));
await tab.eval(() => {
  const rows = [...document.querySelectorAll("tr")].filter(r => /build verified b2b/i.test(r.innerText || ""));
  for (let i = 0; i < rows.length - 1; i++) { const cb = rows[i].querySelector("input[type=checkbox]"); if (cb && !cb.checked) cb.click(); }
});
await new Promise(r => setTimeout(r, 1800));
const found = await tab.eval(() => {
  const out = [];
  for (const e of document.querySelectorAll("*")) {
    const t = (e.textContent||"").trim();
    if (/delete/i.test(t) && t.length < 40 && e.offsetParent !== null) {
      out.push({ tag: e.tagName, t, cls: (e.className||"").toString().slice(0,50), role: e.getAttribute("role") });
    }
  }
  return out.slice(0, 12);
});
console.log("delete-ish:", JSON.stringify(found, null, 1).slice(0, 1500));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_sel.png"); } catch {}
process.exit(0);
