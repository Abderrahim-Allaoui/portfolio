// test_radios2.mjs — unique-name radio click + industry via typing
import { Tab } from "./cdp.mjs";

const tab = await Tab.open(/fiverr/);

const clickRadio = (val) => tab.eval((v) => {
  const r = [...document.querySelectorAll("input[type=radio]")].find(x => x.value === v);
  if (!r) return "NOT FOUND " + v;
  r.name = "solo_" + v;          // break the shared radio-group so nothing unchecks it
  r.scrollIntoView({ block: "center" });
  r.click();
  return v + " checked=" + r.checked;
}, val);

const snap = () => tab.eval(() => [...document.querySelectorAll("input[type=radio]")]
  .filter(r => r.checked).map(r => r.value));

console.log("dur :", await clickRadio("ONE_TO_SEVEN_DAYS"));
console.log("mon :", await clickRadio("9"));
console.log("year:", await clickRadio("2026"));
await new Promise(r => setTimeout(r, 1200));
console.log("CHECKED NOW:", JSON.stringify(await snap()));

// ---------------- industry: type into the combobox
console.log("\n--- industry via typing ---");
await tab.eval(() => {
  const cb = document.querySelector('[role=combobox][name=industries]');
  cb.scrollIntoView({ block: "center" });
  cb.click();
});
await new Promise(r => setTimeout(r, 800));

await tab.eval(() => {
  const inp = document.querySelector('input[placeholder*="industry" i]');
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(inp, "Data");
  inp.dispatchEvent(new Event("input", { bubbles: true }));
});
await new Promise(r => setTimeout(r, 1200));

const sugg = await tab.eval(() => {
  const all = [...document.querySelectorAll("li,div,span,option")].filter(e => e.offsetParent !== null);
  const hits = all.filter(e => {
    const t = (e.innerText || "").trim();
    return t && t.length < 40 && /^(Data|Programming & Tech|AI Services|Business)$/i.test(t);
  });
  return hits.slice(0, 10).map(e => ({ tag: e.tagName, role: e.getAttribute("role"), t: (e.innerText || "").trim() }));
});
console.log("suggestions:", JSON.stringify(sugg));

const picked = await tab.eval(() => {
  const all = [...document.querySelectorAll("li,div,span,option")].filter(e => e.offsetParent !== null);
  const hit = all.find(e => (e.innerText || "").trim() === "Data");
  if (!hit) return "not found";
  hit.click();
  return "clicked Data";
});
console.log("pick:", picked);
await new Promise(r => setTimeout(r, 1000));
console.log("combobox now:", JSON.stringify(await tab.eval(() => {
  const cb = document.querySelector('[role=combobox][name=industries]');
  return (cb?.innerText || "").trim().slice(0, 120);
})));

console.log("FINAL radios:", JSON.stringify(await snap()));
await tab.shot("C:/Users/abder/freelance-pack/tools/_radios2.png");
process.exit(0);
