// probe_gig7.mjs — dump the real DOM of an open orca-combo-box menu
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/manage_gigs/new?wizard=0&tab=general");
await new Promise(r => setTimeout(r, 4500));

const open = async (ix) => {
  const rect = await tab.eval((i) => {
    const c = document.querySelectorAll(".orca-combo-box.category-selector__control")[i];
    if (!c) return null;
    c.scrollIntoView({ block: "center" });
    const r = c.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, ix);
  if (!rect) return "no control";
  for (let k = 0; k < 3; k++) {
    await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
    await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
    await new Promise(r => setTimeout(r, 1200));
    const ok = await tab.eval(() => {
      const el = [...document.querySelectorAll("div")].find(e => {
        const c = (e.className || "").toString();
        return c.includes("orca-combo-box-container") && /results available/.test(e.innerText || "");
      });
      return !!el;
    });
    if (ok) return "opened";
    await tab.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await new Promise(r => setTimeout(r, 400));
  }
  return "could not open";
};

console.log("open cat:", await open(0));
await new Promise(r => setTimeout(r, 800));

const dump = await tab.eval(() => {
  const el = [...document.querySelectorAll("div")].find(e => {
    const c = (e.className || "").toString();
    return c.includes("orca-combo-box-container") && /results available/.test(e.innerText || "");
  });
  if (!el) return { err: "no menu" };
  const options = [...el.querySelectorAll("*")].filter(e => {
    const t = (e.innerText || "").trim();
    return t && t.length < 40 && e.children.length <= 2 && !/focused|results|press/i.test(t);
  });
  return {
    containerCls: (el.className || "").toString().slice(0, 90),
    childTags: [...el.children].map(c => c.tagName + "." + (c.className || "").toString().slice(0, 40)),
    optionish: [...new Set(options.map(o => o.innerText.trim()))].slice(0, 25),
    roles: [...el.querySelectorAll("[role]")].map(r => r.getAttribute("role")).slice(0, 10),
    html: el.outerHTML.slice(0, 1500)
  };
});
console.log(JSON.stringify(dump, null, 1).slice(0, 3500));
process.exit(0);
