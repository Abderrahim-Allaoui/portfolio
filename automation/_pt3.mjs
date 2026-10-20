import { fiverrTab } from "./cdp.mjs";
const U = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=1&tab=pricing";
const tab = await fiverrTab(U, "manage_gigs");
await new Promise(r => setTimeout(r, 4000));
await tab.eval(() => window.scrollTo(0, 700));
await new Promise(r => setTimeout(r, 1200));
const w = await tab.eval(() => {
  const sels = [...document.querySelectorAll("select")].map(s => ({ id: s.id, name: s.name, opts: [...s.options].map(o => o.value + "=" + o.text.trim()).slice(0, 8) }));
  const singles = [...document.querySelectorAll(".meta-single-select, [class*=single-select], [class*=dropdown]")].map(e => ({ cls: (e.className||"").toString().slice(0,60), txt: (e.innerText||"").trim().slice(0,30) })).slice(0, 12);
  const nums = [...document.querySelectorAll("input[type=number]")].filter(e=>e.offsetParent!==null).map((e,i) => `${i} ctx="${((e.closest("label")?.innerText)||(e.parentElement?.parentElement?.innerText||"").split("\n")[0]||"").trim().slice(0,32)}" ph="${e.placeholder}"`);
  const txt = document.body.innerText;
  const i = txt.indexOf("DELIVERY TIME");
  return { sels, singles, nums, around: txt.slice(i, i + 400) };
});
console.log("selects:", JSON.stringify(w.sels).slice(0, 600));
console.log("singles:", JSON.stringify(w.singles).slice(0, 800));
console.log("numbers:\n" + w.nums.join("\n"));
console.log("around:\n" + w.around);
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_pricing3.png"); } catch {}
process.exit(0);
