// probe_gig4.mjs — what does the category control look like after a click?
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/manage_gigs/new?wizard=0&tab=general");
await new Promise(r => setTimeout(r, 4500));

const rect = await tab.eval(() => {
  const leaf = [...document.querySelectorAll("div,span,p,label")].find(e =>
    e.children.length === 0 && (e.textContent || "").trim().toLowerCase() === "select a category");
  if (!leaf) return null;
  leaf.scrollIntoView({ block: "center" });
  const r = leaf.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, html: leaf.parentElement?.parentElement?.outerHTML.slice(0, 900) };
});
console.log("leaf:", JSON.stringify(rect?.w), "html:\n", rect?.html);

await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: rect.x, y: rect.y });
await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
await new Promise(r => setTimeout(r, 1500));

const st = await tab.eval(() => {
  const out = {};
  out.expanded = [...document.querySelectorAll('[aria-expanded]')].map(e => e.getAttribute("aria-expanded")).join(",");
  out.controls = [...document.querySelectorAll('[class*="control"]')].map(c => ({
    cls: (c.className || "").toString().slice(0, 60), expanded: c.getAttribute("aria-expanded"),
    txt: (c.innerText || "").trim().slice(0, 60)
  })).slice(0, 6);
  out.optionish = [...document.querySelectorAll('*')]
    .filter(e => (e.className || "").toString().includes("option") || e.getAttribute("role") === "option")
    .slice(0, 8).map(e => ({ tag: e.tagName, cls: (e.className||"").toString().slice(0,60), vis: e.offsetParent !== null, txt: (e.innerText||"").trim().slice(0,40) }));
  out.menus = [...document.querySelectorAll('[class*="menu"], [class*="menuPortal"], [id*="listbox"]')]
    .map(e => ({ cls: (e.className||"").toString().slice(0,50), vis: e.offsetParent !== null, txt: (e.innerText||"").trim().slice(0,150) })).slice(0,6);
  out.ariaLive = [...document.querySelectorAll('[aria-live]')].map(e => (e.innerText||"").trim().slice(0,150)).slice(0,4);
  return out;
});
console.log("\n", JSON.stringify(st, null, 1).slice(0, 3000));
await tab.shot("C:/Users/abder/freelance-pack/tools/_gig_probe4.png");
process.exit(0);
