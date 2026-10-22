import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/earnings?source=side_navigation", "fiverr");
await wait(5000);
const link = await tab.eval(() => {
  const a = [...document.querySelectorAll("a")].find(x => /financial documents/i.test((x.innerText||"").trim()));
  return a ? (a.getAttribute("href") || "(no href)") : "not found";
});
console.log("Financial documents href:", link);
if (link && link !== "not found" && link !== "(no href)") {
  await tab.goto(link.startsWith("http") ? link : "https://www.fiverr.com" + link);
} else {
  await tab.eval(() => { const a = [...document.querySelectorAll("a")].find(x => /financial documents/i.test((x.innerText||"").trim())); if (a) a.click(); });
}
await wait(4500);
const s = await tab.eval(() => ({
  url: location.href,
  text: document.body.innerText.slice(0, 900),
  files: [...document.querySelectorAll("input[type=file]")].map(e => e.accept || "(any)"),
  btns: [...document.querySelectorAll("button,a")].filter(b=>b.offsetParent!==null).map(b=>(b.innerText||"").trim()).filter(x=>x&&x.length<40).slice(0,12)
}));
console.log("url:", s.url);
console.log("\nTEXT:\n" + s.text);
console.log("\nfiles:", JSON.stringify(s.files));
console.log("btns :", JSON.stringify(s.btns));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_findoc.png"); } catch {}
process.exit(0);
