// probe_gig5.mjs — find a way to OPEN the orca-combo-box category menu
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/manage_gigs/new?wizard=0&tab=general");
await new Promise(r => setTimeout(r, 4500));

const menuState = () => tab.eval(() => {
  const opts = [...document.querySelectorAll("*")].filter(e => {
    const c = (e.className || "").toString().toLowerCase();
    return (c.includes("option") || c.includes("dropdown") || c.includes("listbox") || c.includes("popover"))
      && e.offsetParent !== null && e.children.length <= 6 && (e.innerText || "").trim().length < 3000;
  });
  return {
    n: opts.length,
    sample: opts.slice(0, 5).map(e => ({ tag: e.tagName, cls: (e.className||"").toString().slice(0,70), txt: (e.innerText||"").trim().slice(0,120) })),
    hasData: document.body.innerText.includes("Graphics & Design") && document.body.innerText.indexOf("Graphics & Design") < 3000
  };
});

const ctrl = await tab.eval(() => {
  const c = document.querySelector(".orca-combo-box.category-selector__control") ||
            [...document.querySelectorAll(".orca-combo-box")].find(e => /CATEGORY/i.test(e.innerText));
  if (!c) return null;
  c.scrollIntoView({ block: "center" });
  const r = c.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, txt: c.innerText.trim() };
});
console.log("control:", JSON.stringify(ctrl));
console.log("before  :", JSON.stringify(await menuState()).slice(0, 400));

// --- method 1: real mouse click on the control
await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: ctrl.x, y: ctrl.y });
await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: ctrl.x, y: ctrl.y, button: "left", clickCount: 1 });
await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: ctrl.x, y: ctrl.y, button: "left", clickCount: 1 });
await new Promise(r => setTimeout(r, 1500));
console.log("after m1:", JSON.stringify(await menuState()).slice(0, 500));

// --- method 2: keyboard ArrowDown on the readonly input
await tab.eval(() => {
  const i = document.querySelector(".orca-combo-box input");
  if (i) { i.scrollIntoView({ block: "center" }); i.focus(); }
});
for (const type of ["rawKeyDown", "keyDown"]) {
  await tab.send("Input.dispatchKeyEvent", { type, key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
}
await tab.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
await new Promise(r => setTimeout(r, 1500));
console.log("after m2:", JSON.stringify(await menuState()).slice(0, 500));

// --- method 3: JS mousedown + click on the control
await tab.eval(() => {
  const c = document.querySelector(".orca-combo-box.category-selector__control");
  if (c) {
    c.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    c.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    c.click();
  }
});
await new Promise(r => setTimeout(r, 1500));
console.log("after m3:", JSON.stringify(await menuState()).slice(0, 700));

await tab.shot("C:/Users/abder/freelance-pack/tools/_gig_probe5.png");
process.exit(0);
