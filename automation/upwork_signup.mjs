// upwork_signup.mjs — drive the Upwork freelancer signup (email path)
import { Tab, newTab } from "./cdp.mjs";
import { writeFileSync } from "node:fs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const EMAIL = "allaouiabderrahim1999@gmail.com";
const FIRST = "Abderrahim";
const LAST = "Allaoui";
const PASS = "Abder!2026#Maroc";

const info = await newTab("https://www.upwork.com/nx/signup/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(7000);

console.log("step1:", await tab.eval(() => {
  const els = [...document.querySelectorAll("a")].filter(e => {
    const t = (e.innerText || "").trim().toLowerCase();
    return t.indexOf("a freelancer") >= 0 && t.length < 60;
  });
  if (!els.length) return "not found";
  els[0].click();
  return "clicked freelancer";
}));
await wait(5500);

console.log("step2:", await tab.eval(() => {
  const b = [...document.querySelectorAll("button")].find(x => /continue with email/i.test((x.innerText || "").trim()));
  if (!b) return "no email button";
  b.click();
  return "clicked Continue with Email";
}));
await wait(4500);

console.log("url:", await tab.eval(() => location.href));
const dump = await tab.eval(() => ({
  head: document.body.innerText.slice(0, 600).replace(/\n+/g, " | "),
  inputs: [...document.querySelectorAll("input")].filter(e => e.getClientRects().length)
    .map(e => `${e.type} name="${e.name || e.id}" ph="${e.placeholder || ""}" aut="${e.getAttribute("autocomplete") || ""}"`),
  buttons: [...document.querySelectorAll("button")].filter(b => b.getClientRects().length)
    .map(b => (b.innerText || "").trim()).filter(Boolean).slice(0, 8)
}));
console.log("head:", dump.head);
console.log("inputs:\n  " + dump.inputs.join("\n  "));
console.log("buttons:", JSON.stringify(dump.buttons));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_upwork3.png"); } catch {}
process.exit(0);
