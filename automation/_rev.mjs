// _rev.mjs — inspect the Revisions dropdown options
import { fiverrTab } from "./cdp.mjs";

const U = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=1&tab=pricing";
const tab = await fiverrTab(U, "manage_gigs");
await new Promise(r => setTimeout(r, 4000));

await tab.eval(() => {
  const row = [...document.querySelectorAll("tr")].find(r => (r.innerText || "").trim().split("\n")[0].trim() === "Revisions");
  const el = row.querySelectorAll("div.c3f47d7")[0];
  let sc = el.parentElement;
  while (sc && !(sc.scrollHeight > sc.clientHeight + 80 && sc.clientHeight > 200)) sc = sc.parentElement;
  const box = sc || document.scrollingElement;
  const r0 = el.getBoundingClientRect();
  const target = (box.scrollTop || 0) + r0.top - (box.clientHeight || window.innerHeight) / 2 + r0.height / 2;
  box.scrollTop = Math.max(0, target);
  el.click();
});
await new Promise(r => setTimeout(r, 1500));

const d = await tab.eval(() => {
  const aside = [...document.querySelectorAll("aside")].find(a => a.offsetParent !== null && (a.innerText || "").trim().length > 0);
  if (!aside) return { err: "no aside" };
  const sels = [...aside.querySelectorAll("*")].slice(0, 12).map(e => ({
    tag: e.tagName,
    cls: (e.className || "").toString().slice(0, 45),
    txt: JSON.stringify((e.innerText || "").trim().slice(0, 16)),
    vis: e.offsetParent !== null
  }));
  return { asideCls: (aside.className || "").toString().slice(0, 60), html: aside.innerHTML.slice(0, 1100), sels };
});
console.log(JSON.stringify(d, null, 1).slice(0, 2800));
process.exit(0);
