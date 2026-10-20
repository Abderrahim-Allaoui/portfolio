// cleanup_drafts.mjs — keep 1 draft, delete the rest
import { fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/manage_gigs", "manage_gigs");
await new Promise(r => setTimeout(r, 2500));

const count = () => tab.eval(() => document.body.innerText.match(/DRAFT\s*\((\d+)\)/)?.[1]
  || document.body.innerText.match(/DRAFT\s*\n?\s*(\d+)/)?.[1] || "?");
console.log("draft count:", await count());

// select every draft row except the last one
const sel = await tab.eval(() => {
  const rows = [...document.querySelectorAll("tr")].filter(r => /build verified b2b/i.test(r.innerText || ""));
  if (rows.length < 2) return "rows=" + rows.length;
  for (let i = 0; i < rows.length - 1; i++) {
    const cb = rows[i].querySelector("input[type=checkbox]");
    if (cb && !cb.checked) cb.click();
  }
  return "selected " + (rows.length - 1) + " of " + rows.length;
});
console.log("select:", sel);
await new Promise(r => setTimeout(r, 1500));

const btns = await tab.eval(() => [...document.querySelectorAll("button")].filter(b => b.offsetParent !== null)
  .map(b => (b.innerText || b.getAttribute("aria-label") || "").trim()).filter(Boolean));
console.log("buttons:", JSON.stringify(btns));

const del = await tab.eval(() => {
  const b = [...document.querySelectorAll("button,a")].find(x => /^delete/i.test((x.innerText || "").trim()));
  if (!b) return "no delete button";
  b.click();
  return "clicked delete";
});
console.log("delete:", del);
await new Promise(r => setTimeout(r, 2500));

// confirm dialog
const conf = await tab.eval(() => {
  const b = [...document.querySelectorAll("button,a")].find(x => /^(delete|yes|confirm|ok|delete gig)$/i.test((x.innerText || "").trim()));
  if (!b) return "no confirm button; buttons=" + [...document.querySelectorAll("button")].map(x => (x.innerText||"").trim()).filter(Boolean).slice(0,10).join("|");
  b.click();
  return "confirmed";
});
console.log("confirm:", conf);
await new Promise(r => setTimeout(r, 3000));
console.log("draft count after:", await count());
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_after_delete.png"); } catch {}
process.exit(0);
