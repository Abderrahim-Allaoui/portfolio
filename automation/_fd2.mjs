import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/earnings?source=side_navigation", "fiverr");
await wait(5000);
const r = await tab.eval(() => {
  const t = [...document.querySelectorAll("button,a,div,span,li")].find(e => !e.children.length && (e.textContent||"").trim() === "Financial documents");
  if (!t) return "not found";
  const c = t.closest("button,a,[role=tab],[class*=tab]") || t;
  c.click();
  return "clicked " + c.tagName;
});
console.log(r);
await wait(4000);
const s = await tab.eval(() => ({
  url: location.href,
  text: document.body.innerText.slice(300, 1500),
  files: [...document.querySelectorAll("input[type=file]")].map(e => e.accept || "(any)"),
  btns: [...document.querySelectorAll("button,a")].filter(b=>b.offsetParent!==null).map(b=>(b.innerText||"").trim()).filter(x=>x&&x.length<45).filter(x=>/verif|upload|add|document|continue|next|submit|identity/i.test(x)).slice(0,10)
}));
console.log("url:", s.url);
console.log("TEXT:\n" + s.text);
console.log("files:", JSON.stringify(s.files));
console.log("btns :", JSON.stringify(s.btns));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_findoc2.png"); } catch {}
process.exit(0);
