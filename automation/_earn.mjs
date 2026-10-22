// _earn.mjs — find the ID verification / payout page
import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/earnings", "fiverr");
await wait(5000);

const s = await tab.eval(() => {
  const t = document.body.innerText;
  const out = [];
  for (const e of document.querySelectorAll("a,button")) {
    if (e.offsetParent === null) continue;
    const x = (e.innerText || "").trim();
    const h = e.getAttribute("href") || "";
    if (x && x.length < 60 && /verif|identity|payout|withdraw|bank|payment|method|earn|account/i.test(x + " " + h)) out.push(x + "  =>  " + h);
  }
  return {
    url: location.href,
    links: [...new Set(out)].slice(0, 14),
    text: t.slice(0, 900)
  };
});
console.log("URL:", s.url);
console.log("\nLINKS:\n" + s.links.join("\n"));
console.log("\nTEXT:\n" + s.text);
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_earnings.png"); } catch {}
process.exit(0);
