// test_real2.mjs — click the VISIBLE painted cells, then read FormData
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/portfolio/new");
await new Promise(r => setTimeout(r, 3500));

const snap = () => tab.eval(() => [...document.querySelectorAll("input[type=radio]")]
  .filter(r => r.checked).map(r => r.value));

console.log("before :", JSON.stringify(await snap()));
console.log("type   :", await tab.realClickText("Create project"));
console.log("dur    :", await tab.realClickText("1-7 days"));
console.log("month  :", await tab.realClickText("October"));
console.log("year   :", await tab.realClickText("2026"));
await new Promise(r => setTimeout(r, 1500));
console.log("AFTER  :", JSON.stringify(await snap()));

const fd = await tab.eval(() => {
  const f = document.querySelector("form[name=create]");
  if (!f) return "NO FORM";
  const d = new FormData(f);
  const o = {};
  for (const [k, v] of d.entries()) (o[k] = o[k] || []).push(v);
  return o;
});
console.log("FormData:", JSON.stringify(fd));
process.exit(0);
