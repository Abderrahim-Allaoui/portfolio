// _idv.mjs — click "ID verification" on the dashboard and report what opens
import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/seller_dashboard", "fiverr");
await wait(4500);

const before = await tab.eval(() => location.href);
const clicked = await tab.eval(() => {
  // the "ID verification" checklist row
  const t = [...document.querySelectorAll("div,span,p,h3,h4,li,button,a")]
    .find(e => !e.children.length && (e.textContent || "").trim() === "ID verification");
  if (!t) return "no 'ID verification' text";
  const clickable = t.closest("button,a,[role=button],[class*=clickable]") || t;
  clickable.click();
  return "clicked " + clickable.tagName + " " + (clickable.className || "").toString().slice(0, 50);
});
console.log("click:", clicked);
await wait(4000);
console.log("url   :", await tab.eval(() => location.href), "(was " + before + ")");

const after = await tab.eval(() => {
  const t = document.body.innerText;
  const i = t.toLowerCase().indexOf("verif");
  const dlg = [...document.querySelectorAll("[role=dialog]")].filter(d => d.offsetParent !== null)
    .map(d => (d.innerText || "").trim().slice(0, 400));
  return {
    dialogs: dlg,
    around: i >= 0 ? t.slice(Math.max(0, i - 200), i + 600) : t.slice(0, 400),
    files: [...document.querySelectorAll("input[type=file]")].length,
    buttons: [...document.querySelectorAll("button,a")].filter(b => b.offsetParent !== null)
      .map(b => (b.innerText || "").trim()).filter(x => x && x.length < 45)
      .filter(x => /verif|upload|start|begin|id|continue|next|submit/i.test(x)).slice(0, 8)
  };
});
console.log("\nAFTER:");
console.log(JSON.stringify(after, null, 1).slice(0, 2500));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_idv.png"); } catch {}
process.exit(0);
