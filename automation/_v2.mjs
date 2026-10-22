import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/verification/user", "fiverr");
await wait(5000);
const s0 = await tab.eval(() => ({
  text: document.body.innerText.slice(200, 1000),
  inputs: [...document.querySelectorAll("input")].filter(e=>e.offsetParent!==null).map(e=>`${e.type} ph="${e.placeholder||""}"`),
  files: [...document.querySelectorAll("input[type=file]")].map(e=>e.accept||"(any)")
}));
console.log("STEP 1 of verification:\n" + s0.text);
console.log("\ninputs:", JSON.stringify(s0.inputs));
console.log("files :", JSON.stringify(s0.files));
console.log("\nclick Next:", await tab.clickText("Next", "button"));
await wait(4000);
const s1 = await tab.eval(() => ({
  url: location.href,
  text: document.body.innerText.slice(200, 1100),
  inputs: [...document.querySelectorAll("input")].filter(e=>e.offsetParent!==null).map(e=>`${e.type} ph="${e.placeholder||""}"`),
  files: [...document.querySelectorAll("input[type=file]")].map(e=>e.accept||"(any)"),
  btns: [...document.querySelectorAll("button,a")].filter(b=>b.offsetParent!==null).map(b=>(b.innerText||"").trim()).filter(x=>x&&x.length<40).slice(0,8)
}));
console.log("\nSTEP 2:\n" + s1.text);
console.log("\ninputs:", JSON.stringify(s1.inputs));
console.log("files :", JSON.stringify(s1.files), "| btns:", JSON.stringify(s1.btns));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_verif2.png"); } catch {}
process.exit(0);
