import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/account-settings", "fiverr");
await wait(5000);
const r = await tab.eval(() => {
  const all = [...document.querySelectorAll("*")].filter(e => (e.innerText||"").trim() === "Identity verification");
  const t = all[all.length-1];
  if (!t) return "not found";
  // click the heading and then the whole card
  t.scrollIntoView({block:"center"});
  t.click();
  return "clicked heading";
});
console.log(r);
await wait(3500);
const s = await tab.eval(() => ({
  url: location.href,
  dialogs: [...document.querySelectorAll("[role=dialog]")].filter(d=>d.offsetParent!==null).map(d=>d.innerText.replace(/\n+/g," | ").slice(0,600)),
  files: [...document.querySelectorAll("input[type=file]")].map(e=>e.accept||"(any)"),
  btns: [...document.querySelectorAll("button,a")].filter(b=>b.offsetParent!==null).map(b=>(b.innerText||"").trim()).filter(x=>x&&x.length<45).filter(x=>/verif|upload|start|begin|continue|next|submit|id|document|passport/i.test(x)).slice(0,10)
}));
console.log("dialogs:", JSON.stringify(s.dialogs, null, 1).slice(0,1200));
console.log("files:", JSON.stringify(s.files), "| btns:", JSON.stringify(s.btns));
console.log("url:", s.url);
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_idpage.png"); } catch {}
process.exit(0);
