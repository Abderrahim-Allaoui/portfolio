// upwork_create.mjs — fill + submit the Upwork signup
import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const EMAIL = "allaouiabderrahim1999@gmail.com";
const FIRST = "Abderrahim";
const LAST = "Allaoui";
const PASS = "Abder!2026#Maroc";

const info = await newTab("https://www.upwork.com/nx/signup/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(8000);

// freelancer -> email
await tab.eval(() => {
  const e = [...document.querySelectorAll("a")].find(x => {
    const t = (x.innerText || "").trim().toLowerCase();
    return t.indexOf("a freelancer") >= 0 && t.length < 60;
  });
  if (e) e.click();
});
await wait(6000);
await tab.eval(() => {
  const b = [...document.querySelectorAll("button")].find(x => /continue with email/i.test((x.innerText || "").trim()));
  if (b) b.click();
});
await wait(6000);

const filled = await tab.eval((o) => {
  // the 4 visible inputs in DOM order: first, last, email, password
  const ins = [...document.querySelectorAll("input")].filter(e =>
    e.getClientRects().length && ["text", "email", "password"].includes(e.type));
  if (ins.length < 4) return "only " + ins.length + " inputs";
  const vals = [o.first, o.last, o.email, o.pass];
  ins.slice(0, 4).forEach((el, i) => {
    const proto = HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, vals[i]);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
  });
  // checkboxes: the one whose label mentions the Terms
  const boxes = [...document.querySelectorAll('input[type=checkbox]')];
  for (const b of boxes) {
    const lab = (b.closest("label")?.innerText || b.parentElement?.innerText || "");
    if (/agree|terms/i.test(lab) && !b.checked) b.click();
  }
  return {
    set: ins.slice(0, 4).map(e => (e.type === "password" ? "pass*" : e.value)),
    boxes: boxes.map(b => b.checked)
  };
}, { first: FIRST, last: LAST, email: EMAIL, pass: PASS });
console.log("filled:", JSON.stringify(filled));
await wait(1200);

console.log("submit:", await tab.eval(() => {
  const b = [...document.querySelectorAll("button")].find(x => /create my account/i.test((x.innerText || "").trim()));
  if (!b) return "no submit button";
  b.scrollIntoView({ block: "center" });
  b.click();
  return "clicked Create my account";
}));
await wait(11000);

const after = await tab.eval(() => ({
  url: location.href,
  head: document.body.innerText.slice(0, 800).replace(/\n+/g, " | "),
  inputs: [...document.querySelectorAll("input")].filter(e => e.getClientRects().length)
    .map(e => `${e.type} ph="${e.placeholder || ""}"`)
}));
console.log("url:", after.url);
console.log("head:", after.head);
console.log("inputs:", JSON.stringify(after.inputs).slice(0, 500));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_upwork_after.png"); } catch {}
process.exit(0);
