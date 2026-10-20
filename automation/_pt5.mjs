import { fiverrTab } from "./cdp.mjs";
const U = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=1&tab=pricing";
const tab = await fiverrTab(U, "manage_gigs");
await new Promise(r => setTimeout(r, 4000));
await tab.eval(() => { const t = [...document.querySelectorAll("div,span")].find(e => !e.children.length && (e.textContent||"").trim() === "DELIVERY TIME"); if (t) t.scrollIntoView({block:"center"}); });
await new Promise(r => setTimeout(r, 1500));
const w = await tab.eval(() => {
  const dds = [...document.querySelectorAll("[class*=additional-dropd]")].filter(e => e.offsetParent !== null);
  const out = dds.map((e, i) => {
    const row = e.closest("tr");
    return { i, txt: (e.innerText || "").trim().slice(0, 18), row: (row?.innerText || e.parentElement?.parentElement?.innerText || "").replace(/\n+/g, " | ").slice(0, 60) };
  });
  return out;
});
console.log(JSON.stringify(w, null, 1).slice(0, 2500));
process.exit(0);
