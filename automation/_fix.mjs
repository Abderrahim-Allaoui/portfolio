// _fix.mjs — add remaining FAQ entries and requirement questions, then dump publish
import { fiverrTab } from "./cdp.mjs";
import { readFileSync } from "node:fs";

const GIG = JSON.parse(readFileSync("./gig1.json", "utf8"));
const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=2&tab=faq_description`, "manage_gigs");
await wait(4500);

const btnInfo = async (tag) => tab.eval((t) => [...document.querySelectorAll("button,a")]
  .filter(b => b.offsetParent !== null)
  .map(b => ({ tag: b.tagName, txt: (b.innerText || "").trim().slice(0, 30), dis: b.disabled || b.getAttribute("aria-disabled") }))
  .filter(x => x.txt && /faq|question|add/i.test(x.txt)), tag);

console.log("FAQ buttons before:", JSON.stringify(await btnInfo()));

// how many faq rows already exist?
const faqRows = () => tab.eval(() => {
  const eds = [...document.querySelectorAll("[contenteditable=true]")].filter(e => e.offsetParent !== null);
  const ins = [...document.querySelectorAll("input")].filter(e => e.offsetParent !== null && e.type === "text");
  return { editors: eds.length, inputs: ins.length };
});
console.log("rows:", JSON.stringify(await faqRows()));

for (let i = 0; i < GIG.faq.length; i++) {
  const r = await tab.eval(() => {
    const bs = [...document.querySelectorAll("button,a")].filter(x => /add\s*faq/i.test((x.innerText || "").trim()) && !x.disabled);
    if (!bs.length) return "no add-faq button";
    bs[0].click();
    return "clicked";
  });
  if (r !== "clicked") { console.log("  faq add:", r); break; }
  await wait(1400);
  const ok = await tab.eval((pair, n) => {
    const eds = [...document.querySelectorAll("[contenteditable=true]")].filter(e => e.offsetParent !== null);
    const ins = [...document.querySelectorAll("input")].filter(e => e.offsetParent !== null && e.type === "text");
    const q = ins[ins.length - 1], a = eds[eds.length - 1];
    if (!q || !a) return "missing (ins=" + ins.length + " eds=" + eds.length + ")";
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    set.call(q, pair[0]);
    q.dispatchEvent(new Event("input", { bubbles: true }));
    q.dispatchEvent(new Event("change", { bubbles: true }));
    a.focus();
    document.execCommand("insertText", false, pair[1]);
    a.dispatchEvent(new Event("input", { bubbles: true }));
    return "faq " + n + " ok";
  }, GIG.faq[i], i);
  console.log("  faq[" + i + "]:", ok);
  await wait(900);
}
await tab.clickText("Save", "button");
await wait(3000);
console.log("FAQ rows after:", JSON.stringify(await faqRows()));

// ---------------- requirements
await tab.goto(`${EDIT}?wizard=3&tab=requirements`);
await wait(4500);
console.log("\nREQ buttons:", JSON.stringify(await btnInfo()));
for (let i = 0; i < GIG.requirements.length; i++) {
  const r = await tab.eval(() => {
    const bs = [...document.querySelectorAll("button,a")].filter(x => /add new question/i.test((x.innerText || "").trim()));
    if (!bs.length) return "no add button";
    bs[bs.length - 1].click();
    return "added";
  });
  await wait(1400);
  const filled = await tab.eval((qq) => {
    const tas = [...document.querySelectorAll("textarea")].filter(e => e.offsetParent !== null);
    const t = tas[tas.length - 1];
    if (!t) return "no textarea";
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(t, qq);
    t.dispatchEvent(new Event("input", { bubbles: true }));
    t.dispatchEvent(new Event("change", { bubbles: true }));
    return "filled: " + qq.slice(0, 34);
  }, GIG.requirements[i]);
  console.log("  req[" + i + "]:", r, "|", filled);
  await wait(800);
}
await tab.clickText("Save", "button");
await wait(3000);
console.log("REQ textareas now:", await tab.eval(() => [...document.querySelectorAll("textarea")].filter(e => e.offsetParent !== null).length));

// ---------------- publish page full text
await tab.goto(`${EDIT}?wizard=5&tab=publish`);
await wait(4500);
const pubText = await tab.eval(() => {
  const t = document.body.innerText;
  const i = t.indexOf("Your service was created");
  return t.slice(Math.max(0, i - 100), i + 900);
});
console.log("\n=== PUBLISH PAGE ===\n" + pubText);
process.exit(0);
