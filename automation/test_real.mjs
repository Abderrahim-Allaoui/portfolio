// test_real.mjs — mimic a human filling the form with real mouse clicks
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/portfolio/new");
await new Promise(r => setTimeout(r, 3000));

const snap = () => tab.eval(() => [...document.querySelectorAll("input[type=radio]")]
  .filter(r => r.checked).map(r => r.value + ":" + r.name));

console.log("before:", JSON.stringify(await snap()));
console.log("type   :", await tab.realClickRadio("CREATE_PROJECT"));
console.log("dur    :", await tab.realClickRadio("ONE_TO_SEVEN_DAYS"));
console.log("month  :", await tab.realClickRadio("9"));
console.log("year   :", await tab.realClickRadio("2026"));
await new Promise(r => setTimeout(r, 1500));
console.log("AFTER  :", JSON.stringify(await snap()));

// what would the server receive?
const fd = await tab.eval(() => {
  const f = document.querySelector("form[name=create]");
  const fd = new FormData(f);
  const o = {};
  for (const [k, v] of fd.entries()) { (o[k] = o[k] || []).push(v); }
  return o;
});
console.log("FormData:", JSON.stringify(fd));
process.exit(0);
