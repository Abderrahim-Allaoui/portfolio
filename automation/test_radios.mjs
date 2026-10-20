// test_radios.mjs — click radios by their unique value, verify .checked
import { Tab } from "./cdp.mjs";

const tab = await Tab.open(/fiverr/);

const clickRadio = (val) => tab.eval((v) => {
  const r = [...document.querySelectorAll("input[type=radio]")].find(x => x.value === v);
  if (!r) return "NOT FOUND value=" + v;
  r.scrollIntoView({ block: "center" });
  r.click();
  return "clicked " + v + " -> checked=" + r.checked;
}, val);

const snapshot = () => tab.eval(() => [...document.querySelectorAll("input[type=radio]")]
  .filter(r => r.checked).map(r => r.value));

console.log("initial checked:", JSON.stringify(await snapshot()));

console.log("duration:", await clickRadio("ONE_TO_SEVEN_DAYS"));
console.log("after dur:", JSON.stringify(await snapshot()));

console.log("month   :", await clickRadio("9"));
console.log("after mon:", JSON.stringify(await snapshot()));

console.log("year    :", await clickRadio("2026"));
console.log("after yr :", JSON.stringify(await snapshot()));

// ---- industry combobox
console.log("\n--- industry ---");
const opened = await tab.eval(() => {
  const cb = document.querySelector('[role=combobox][name=industries]');
  if (!cb) return "no combobox";
  cb.scrollIntoView({ block: "center" });
  cb.click();
  return "clicked combobox, expanded=" + cb.getAttribute("aria-expanded");
});
console.log(opened);
await new Promise(r => setTimeout(r, 1200));

const opts = await tab.eval(() => [...document.querySelectorAll("[role=option]")]
  .filter(e => e.offsetParent !== null)
  .map(e => (e.innerText || "").trim()).filter(Boolean).slice(0, 30));
console.log("visible options:", JSON.stringify(opts));

const pick = await tab.eval(() => {
  const all = [...document.querySelectorAll("[role=option]")].filter(e => e.offsetParent !== null);
  const want = ["Data", "Programming & Tech", "AI Services", "Business", "Consulting", "Marketing"];
  const hit = all.find(e => want.includes((e.innerText || "").trim()));
  if (!hit) return "none of " + want.join("/") + " in " + all.map(e => (e.innerText||"").trim()).join(",");
  hit.click();
  return "picked " + (hit.innerText || "").trim();
});
console.log("pick:", pick);
await new Promise(r => setTimeout(r, 900));
console.log("selected industries:", JSON.stringify(await tab.eval(() =>
  document.querySelector('[role=combobox][name=industries]')?.innerText?.trim())));

console.log("final checked radios:", JSON.stringify(await snapshot()));
await tab.shot("C:/Users/abder/freelance-pack/tools/_radios.png");
process.exit(0);
