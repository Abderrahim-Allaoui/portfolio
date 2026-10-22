import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/seller_dashboard", "fiverr");
await wait(4500);
const d = await tab.eval(() => {
  const out = [];
  for (const e of document.querySelectorAll("a,button")) {
    if (e.offsetParent === null) continue;
    const x = (e.innerText || "").trim();
    const h = e.getAttribute("href") || "";
    if (/verif|identity|trust|payout|earning|level|withdraw|bank/i.test(x + " " + h) && x.length < 60) out.push(x + "  =>  " + h);
  }
  const t = document.body.innerText;
  const i = t.toLowerCase().indexOf("id verification");
  return { links: [...new Set(out)].slice(0, 12), around: i >= 0 ? t.slice(Math.max(0, i - 200), i + 300) : "(no id-verification text)" };
});
console.log("LINKS:", JSON.stringify(d.links, null, 1));
console.log("\nAROUND:\n" + d.around);
process.exit(0);
