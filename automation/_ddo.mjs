import { fiverrTab } from "./cdp.mjs";
const U = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=1&tab=pricing";
const tab = await fiverrTab(U, "manage_gigs");
await new Promise(r => setTimeout(r, 4000));
const before = await tab.eval(() => document.querySelectorAll("body *").length);
await tab.eval(() => {
  const row = [...document.querySelectorAll("tr")].find(r => (r.innerText||"").trim().split("\n")[0].trim() === "DELIVERY TIME");
  const el = row.querySelectorAll("div.c3f47d7")[0];
  el.scrollIntoView({block:"center"});
  el.click();
});
await new Promise(r => setTimeout(r, 1800));
const after = await tab.eval(() => {
  const out = { n: document.querySelectorAll("body *").length };
  out.asides = [...document.querySelectorAll("aside")].map(a => ({ vis: a.offsetParent!==null, cls:(a.className||"").toString().slice(0,50), txt:(a.innerText||"").replace(/\n+/g," | ").slice(0,150) }));
  out.uls = [...document.querySelectorAll("ul")].filter(u=>u.offsetParent!==null && u.innerText.trim().length>0 && u.innerText.length<300).map(u => (u.innerText||"").replace(/\n+/g," | ").slice(0,120));
  out.lis = [...document.querySelectorAll("li")].filter(l=>l.offsetParent!==null && (l.innerText||"").trim().length<30 && (l.innerText||"").trim().length>0).map(l=>(l.innerText||"").trim()).slice(0,20);
  return out;
});
console.log("nodes:", before, "->", after.n);
console.log(JSON.stringify(after, null, 1).slice(0, 2000));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_dd_open.png"); } catch {}
process.exit(0);
