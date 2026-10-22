// test_dd.mjs — drive the three dropdowns like a human
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/portfolio/new");
await new Promise(r => setTimeout(r, 4000));

const click = async (txt, exact = true, wait = 900) => {
  const r = await tab.realClickText(txt, "*", exact);
  await new Promise(res => setTimeout(res, wait));
  console.log("  click " + JSON.stringify(txt) + " -> " + r);
  return r;
};

console.log("PROJECT DURATION");
await click("Select duration.", false);
await click("1-7 days");

console.log("MONTH");
await click("MM", true);
await click("October");

console.log("YEAR");
await click("YY", true);
await click("2026");

const fd = await tab.eval(() => {
  const f = document.querySelector("form[name=create]");
  if (!f) return "NO FORM";
  const d = new FormData(f);
  const o = {};
  for (const [k, v] of d.entries()) (o[k] = o[k] || []).push(v);
  return o;
});
console.log("FormData:", JSON.stringify(fd));
console.log("checked :", JSON.stringify(await tab.eval(() =>
  [...document.querySelectorAll("input[type=radio]")].filter(r => r.checked).map(r => r.value))));
console.log("body    :", (await tab.eval(() => document.body.innerText.slice(200, 900))).replace(/\n+/g, " | "));
await tab.shot("C:/Users/abder/freelance-pack/tools/_dd.png");
process.exit(0);
