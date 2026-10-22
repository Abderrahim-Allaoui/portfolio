import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/verification/user", "fiverr");
await wait(5000);
const p = await tab.eval(() => {
  const el = [...document.querySelectorAll("p")].find(e => (e.textContent||"").trim() === "As part of my primary job or profession");
  if (!el) return "not found";
  el.scrollIntoView({block:"center"});
  el.click();
  return "clicked p";
});
console.log(p);
await wait(1200);
console.log("next:", await tab.clickText("Next", "button"));
await wait(4500);
const s = await tab.eval(() => ({
  url: location.href,
  text: document.body.innerText.slice(180, 900).replace(/\n+/g, " | "),
  inputs: [...document.querySelectorAll("input")].filter(e=>e.offsetParent!==null).map(e=>`${e.type} ph="${e.placeholder||""}" lbl="${(e.closest("label")?.innerText||e.parentElement?.parentElement?.innerText||"").trim().split("\n")[0].slice(0,40)}"`),
  selects: [...document.querySelectorAll("select")].filter(e=>e.offsetParent!==null).map(s=>`${s.name||"(noname)"}: ${[...s.options].map(o=>o.text.trim()).slice(0,10).join(" | ")}`),
  files: [...document.querySelectorAll("input[type=file]")].map(e=>e.accept||"(any)"),
  btns: [...document.querySelectorAll("button,a")].filter(b=>b.offsetParent!==null).map(b=>(b.innerText||"").trim()).filter(x=>x&&x.length<40).slice(0,10)
}));
console.log("\nSTEP2 url:", s.url);
console.log("text :", s.text);
console.log("inputs:", JSON.stringify(s.inputs, null, 1).slice(0,900));
console.log("selects:", JSON.stringify(s.selects, null, 1).slice(0,700));
console.log("files :", JSON.stringify(s.files));
console.log("btns  :", JSON.stringify(s.btns));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_vstep2.png"); } catch {}
process.exit(0);
