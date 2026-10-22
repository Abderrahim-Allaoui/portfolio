// _vflow.mjs — walk the Fiverr identity verification flow and report each step
import { Tab, fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const tab = await fiverrTab("https://www.fiverr.com/verification/user", "fiverr");
await wait(5000);

const step = async (label) => {
  const s = await tab.eval(() => ({
    url: location.href,
    text: document.body.innerText.slice(180, 1000).replace(/\n+/g, " | "),
    inputs: [...document.querySelectorAll("input")].filter(e => e.offsetParent !== null)
      .map(e => `${e.type}${e.checked ? "*" : ""} ph="${e.placeholder || ""}" lbl="${(e.closest("label")?.innerText || e.parentElement?.parentElement?.innerText || "").trim().split("\n")[0].slice(0, 40)}"`),
    selects: [...document.querySelectorAll("select")].filter(e => e.offsetParent !== null)
      .map(s => `${s.name}: ${[...s.options].map(o => o.text.trim()).slice(0, 8).join("|")}`),
    files: [...document.querySelectorAll("input[type=file]")].map(e => e.accept || "(any)"),
    btns: [...document.querySelectorAll("button,a")].filter(b => b.offsetParent !== null)
      .map(b => (b.innerText || "").trim()).filter(x => x && x.length < 40).slice(0, 10)
  }));
  console.log(`\n===== ${label} =====`);
  console.log("url   :", s.url);
  console.log("inputs:", JSON.stringify(s.inputs, null, 1).slice(0, 800));
  if (s.selects.length) console.log("selects:", JSON.stringify(s.selects, null, 1).slice(0, 600));
  console.log("files :", JSON.stringify(s.files));
  console.log("btns  :", JSON.stringify(s.btns));
  return s;
};

await step("STEP 1 — how will you use Fiverr?");

// pick "As part of my primary job or profession" (index 1) then Next
const picked = await tab.eval(() => {
  const t = [...document.querySelectorAll("span,div,label")].find(e => !e.children.length && (e.textContent || "").trim() === "As part of my primary job or profession");
  if (!t) return "label not found";
  const inp = t.closest("label")?.querySelector("input") || t.parentElement?.querySelector("input");
  if (inp) { inp.click(); return "radio clicked"; }
  t.click();
  return "text clicked";
});
console.log("\npick:", picked);
await wait(900);
console.log("next :", await tab.clickText("Next", "button"));
await wait(4000);
await step("STEP 2");

try { await tab.shot("C:/Users/abder/freelance-pack/tools/_vstep2.png"); } catch {}
process.exit(0);
