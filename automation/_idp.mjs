import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/account-settings", "fiverr");
await wait(5000);
const r = await tab.eval(() => {
  const t = [...document.querySelectorAll("a,button,div,span,h3,h4")].find(e =>
    !e.children.length && (e.textContent||"").trim() === "Identity verification");
  if (!t) return "not found";
  const c = t.closest("a,button,[role=link],[class*=clickable]") || t;
  return { tag: c.tagName, href: c.getAttribute("href"), cls: (c.className||"").toString().slice(0,50), parent: c.parentElement?.outerHTML.slice(0,300) };
});
console.log(JSON.stringify(r, null, 1).slice(0, 900));
if (r && r.href) {
  await tab.goto(r.href.startsWith("http") ? r.href : "https://www.fiverr.com" + r.href);
} else {
  await tab.eval(() => { const t=[...document.querySelectorAll("a,button,div,span")].find(e=>!e.children.length&&(e.textContent||"").trim()==="Identity verification"); if(t){const c=t.closest("a,button,[role=link]")||t; c.click();} });
}
await wait(4500);
const s = await tab.eval(() => ({
  url: location.href, title: document.title,
  text: document.body.innerText.slice(250, 1200),
  files: [...document.querySelectorAll("input[type=file]")].map(e=>e.accept||"(any)"),
  btns: [...document.querySelectorAll("button,a")].filter(b=>b.offsetParent!==null).map(b=>(b.innerText||"").trim()).filter(x=>x&&x.length<40).slice(0,12)
}));
console.log("\nURL:", s.url);
console.log("TEXT:\n" + s.text);
console.log("files:", JSON.stringify(s.files));
console.log("btns :", JSON.stringify(s.btns));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_idpage.png"); } catch {}
process.exit(0);
