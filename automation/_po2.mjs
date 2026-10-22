// _po2.mjs — pick Payoneer, continue, see the next step (ID?)
import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/earnings?source=side_navigation", "fiverr");
await wait(5000);

await tab.eval(() => {
  const b = [...document.querySelectorAll("button,a")].find(x => /add payout method/i.test((x.innerText || "").trim()));
  if (b) b.click();
});
await wait(3000);

const sel = await tab.eval(() => {
  // the Payoneer radio: a radio whose nearby text mentions Payoneer
  const radios = [...document.querySelectorAll("input[type=radio]")].filter(e => e.offsetParent !== null);
  for (const r of radios) {
    const row = r.closest("div")?.parentElement || r.parentElement;
    if (/payoneer/i.test(row?.innerText || "")) { r.click(); return "payoneer radio clicked"; }
  }
  // fallback: click the text "Payoneer account"
  const t = [...document.querySelectorAll("span,div,label")].find(e => !e.children.length && (e.textContent || "").trim() === "Payoneer account");
  if (t) { t.click(); return "clicked label"; }
  return "not found (" + radios.length + " radios)";
});
console.log("select:", sel);
await wait(1200);
console.log("continue:", await tab.clickText("Continue", "button"));
await wait(4500);

const s = await tab.eval(() => {
  const t = document.body.innerText;
  const dlg = [...document.querySelectorAll("[role=dialog]")].filter(d => d.offsetParent !== null)
    .map(d => d.innerText.replace(/\n+/g, " | ").slice(0, 700));
  const i = t.search(/payoneer|verif|identity|id|upload|document|passport|licence|identity card/i);
  return {
    url: location.href,
    dialog: dlg,
    files: [...document.querySelectorAll("input[type=file]")].map(e => e.accept || "(any)"),
    around: i >= 0 ? t.slice(Math.max(0, i - 150), i + 700) : "(no match)",
    btns: [...document.querySelectorAll("button,a")].filter(b => b.offsetParent !== null)
      .map(b => (b.innerText || "").trim()).filter(x => x && x.length < 40)
      .filter(x => /continue|next|verify|upload|submit|confirm/i.test(x)).slice(0, 8)
  };
});
console.log("url   :", s.url);
console.log("dialog:", JSON.stringify(s.dialog).slice(0, 900));
console.log("files :", JSON.stringify(s.files));
console.log("around:\n" + s.around);
console.log("btns  :", JSON.stringify(s.btns));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_po2.png"); } catch {}
process.exit(0);
