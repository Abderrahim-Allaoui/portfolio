// upwork_form.mjs — click "Fill out manually" and walk the 10-step profile form
import { Tab, newTab } from "./cdp.mjs";
import { readFileSync } from "node:fs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const info = await newTab("https://www.upwork.com/nx/create-profile/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(20000);

// skip the 3 questions fast
await tab.eval(() => {
  const b = [...document.querySelectorAll("button")].find(x => /get started/i.test((x.innerText || "").trim()));
  if (b) b.click();
});
await wait(8000);
await tab.eval(() => {
  const r = [...document.querySelectorAll('input[type=radio]')].find(x => x.value === "NEW_TO_ME");
  if (r) r.click();
});
await wait(800);
await tab.clickText("Next", "button");
await wait(8000);
await tab.eval(() => {
  const r = [...document.querySelectorAll('input[type=radio]')].find(x => x.value === "MAIN_INCOME");
  if (r) r.click();
});
await wait(800);
await tab.clickText("Next", "button");
await wait(8000);
await tab.eval(() => {
  [...document.querySelectorAll('input[type=checkbox]')].filter(x => x.getClientRects().length).forEach(c => { if (!c.checked) c.click(); });
});
await wait(800);
await tab.clickText("Next, create a profile", "button");
await wait(9000);

// fill manually
console.log("manual:", await tab.eval(() => {
  const b = [...document.querySelectorAll("button")].find(x => /fill out manually/i.test((x.innerText || "").trim()));
  if (!b) return "no manual button";
  b.click();
  return "clicked";
}));
await wait(10000);

const dump = async (tag) => {
  const d = await tab.eval(() => ({
    url: location.href,
    head: document.body.innerText.slice(0, 700).replace(/\n+/g, " | "),
    inputs: [...document.querySelectorAll("input,textarea")].filter(e => e.getClientRects().length)
      .map(e => `${e.tagName}/${e.type || ""} name="${e.name || e.id || ""}" ph="${(e.placeholder || "").slice(0, 36)}" val="${(e.value || "").slice(0, 24)}"`),
    buttons: [...document.querySelectorAll("button")].filter(b => b.getClientRects().length)
      .map(b => (b.innerText || "").trim()).filter(Boolean).slice(0, 8)
  }));
  console.log(`\n===== ${tag} =====`);
  console.log("url   :", d.url);
  console.log("head  :", d.head);
  console.log("inputs:\n  " + d.inputs.join("\n  "));
  console.log("buttons:", JSON.stringify(d.buttons));
  return d;
};

await dump("FORM step 1");
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_upw_f1.png"); } catch {}
process.exit(0);
