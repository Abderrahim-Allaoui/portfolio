// probe_gig3.mjs — open the Category react-select and list its options
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/manage_gigs/new?wizard=0&tab=general");
await new Promise(r => setTimeout(r, 4500));

// click the control that shows "SELECT A CATEGORY"
const r1 = await tab.eval(() => {
  const leaf = [...document.querySelectorAll("div,span,p")].find(e =>
    e.children.length === 0 && (e.textContent || "").trim() === "SELECT A CATEGORY");
  if (!leaf) return "not found";
  const r = leaf.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, tag: leaf.tagName, cls: (leaf.className||"").toString().slice(0,50) };
});
console.log("label rect:", JSON.stringify(r1));

if (r1 && r1.x) {
  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r1.x, y: r1.y });
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r1.x, y: r1.y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: r1.x, y: r1.y, button: "left", clickCount: 1 });
  await new Promise(r => setTimeout(r, 1200));
}

const opts = await tab.eval(() => [...document.querySelectorAll('[class*="-option"], [role=option]')]
  .filter(e => e.offsetParent !== null).map(e => (e.innerText || "").trim()).filter(Boolean));
console.log("options:", JSON.stringify(opts.slice(0, 40)));

// pick "Data"
const picked = await tab.eval(() => {
  const o = [...document.querySelectorAll('[class*="-option"], [role=option]')]
    .filter(e => e.offsetParent !== null && (e.innerText || "").trim() === "Data");
  if (!o.length) return "Data not in list";
  o[0].click();
  return "clicked Data";
});
console.log("pick:", picked);
await new Promise(r => setTimeout(r, 1500));

// now the subcategory
const sub = await tab.eval(() => {
  const leaf = [...document.querySelectorAll("div,span,p")].find(e =>
    e.children.length === 0 && /SUBCATEGORY/i.test((e.textContent || "").trim()));
  if (!leaf) return "no subcategory label";
  const r = leaf.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, txt: leaf.textContent.trim() };
});
console.log("subcat label:", JSON.stringify(sub));
if (sub && sub.x) {
  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: sub.x, y: sub.y });
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: sub.x, y: sub.y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: sub.x, y: sub.y, button: "left", clickCount: 1 });
  await new Promise(r => setTimeout(r, 1200));
}
const subopts = await tab.eval(() => [...document.querySelectorAll('[class*="-option"], [role=option]')]
  .filter(e => e.offsetParent !== null).map(e => (e.innerText || "").trim()).filter(Boolean));
console.log("subcat options:", JSON.stringify(subopts.slice(0, 40)));

const after = await tab.eval(() => ({
  rs: [...document.querySelectorAll("input[id^='react-select']")].map(i => ({ id: i.id, v: i.value })),
  textareas: [...document.querySelectorAll("textarea")].map(t => ({ max: t.maxLength, ph: t.placeholder, v: (t.value||"").slice(0,30) })),
  text: document.body.innerText.slice(600, 1600)
}));
console.log("after:", JSON.stringify(after, null, 1).slice(0, 2200));
await tab.shot("C:/Users/abder/freelance-pack/tools/_gig_probe3.png");
process.exit(0);
