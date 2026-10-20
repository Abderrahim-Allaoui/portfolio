import { fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/manage_gigs", "manage_gigs");
const links = await tab.eval(() => [...document.querySelectorAll("a")].map(a => ({ h: a.getAttribute("href"), t: (a.innerText||"").trim().slice(0,60) })).filter(x => x.h && /gig/i.test(x.h)));
console.log(JSON.stringify(links, null, 1).slice(0, 1800));
const btns = await tab.eval(() => [...document.querySelectorAll("button")].filter(b=>b.offsetParent!==null).map(b=>(b.innerText||b.getAttribute("aria-label")||"").trim()).filter(Boolean).slice(0,20));
console.log("buttons:", JSON.stringify(btns));
process.exit(0);
