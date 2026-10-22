// _pub.mjs — exact publish-step state + where the ID verification lives
import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=5&tab=publish", "manage_gigs");
await wait(5000);

const s = await tab.eval(() => {
  const t = document.body.innerText;
  const i = t.indexOf("Your service was created");
  const ctas = [];
  for (const e of document.querySelectorAll("button,a")) {
    if (e.offsetParent === null) continue;
    const x = (e.innerText || "").trim();
    if (x && x.length < 40) ctas.push(e.tagName + ":" + x);
  }
  return {
    section: t.slice(Math.max(0, i - 60), i + 450),
    ctas: [...new Set(ctas)].filter(x => !/Fiverr|Explore|Dashboard|Orders|Gigs|Profile|Earnings|Analytics|Support|Forum|Guides|Answers|Community|Sign|English|USD|refer|Account|Invitation|Affiliates|Press|Investor|Extensions|Category/i.test(x))
  };
});
console.log("=== PUBLISH STEP ===");
console.log(s.section);
console.log("\nCTAs:", JSON.stringify(s.ctas));

// dashboard: where is ID verification?
await tab.goto("https://www.fiverr.com/users/allaouiabder/seller_dashboard");
await wait(4500);
const d = await tab.eval(() => {
  const out = [];
  for (const e of document.querySelectorAll("a,button")) {
    if (e.offsetParent === null) continue;
    const x = (e.innerText || "").trim();
    const h = e.getAttribute("href") || "";
    if (/verif|identity|id|trust|payout|earning|level/i.test(x + " " + h) && x.length < 60) out.push(x + " => " + h);
  }
  const t = document.body.innerText;
  const i = t.toLowerCase().indexOf("id verification");
  return { links: [...new Set(out)].slice(0, 10), around: i >= 0 ? t.slice(Math.max(0, i - 120), i + 260) : "no 'id verification' text" };
});
console.log("\n=== DASHBOARD ===");
console.log("links:", JSON.stringify(d.links, null, 1));
console.log("around:", d.around);
process.exit(0);
