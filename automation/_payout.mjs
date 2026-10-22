// _payout.mjs — open the "Add payout method" flow and report what it needs
import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/earnings?source=side_navigation", "fiverr");
await wait(5000);

const clicked = await tab.eval(() => {
  const b = [...document.querySelectorAll("button,a")].find(x => /add payout method/i.test((x.innerText || "").trim()));
  if (!b) return "not found";
  b.click();
  return "clicked";
});
console.log("click:", clicked);
await wait(4000);

const s = await tab.eval(() => {
  const t = document.body.innerText;
  const dlg = [...document.querySelectorAll("[role=dialog]")].filter(d => d.offsetParent !== null);
  return {
    url: location.href,
    dialog: dlg.length ? dlg[0].innerText.replace(/\n+/g, " | ").slice(0, 900) : "(no dialog)",
    inputs: [...document.querySelectorAll("input")].filter(e => e.offsetParent !== null)
      .map(e => `${e.type} ph="${e.placeholder || ""}"`).slice(0, 12),
    files: [...document.querySelectorAll("input[type=file]")].map(e => e.accept || "(any)"),
    btns: [...document.querySelectorAll("button,a")].filter(b => b.offsetParent !== null)
      .map(b => (b.innerText || "").trim()).filter(x => x && x.length < 40)
      .filter(x => /paypal|payoneer|bank|add|continue|next|verif|id/i.test(x)).slice(0, 10),
    body: t.slice(t.indexOf("Earnings") > 0 ? t.indexOf("Earnings") : 0, 1400)
  };
});
console.log("url    :", s.url);
console.log("dialog :", s.dialog);
console.log("inputs :", JSON.stringify(s.inputs));
console.log("files  :", JSON.stringify(s.files));
console.log("buttons:", JSON.stringify(s.btns));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_payout.png"); } catch {}
process.exit(0);
