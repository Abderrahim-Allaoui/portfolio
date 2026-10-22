// debug_click.mjs — where exactly should we click the radio?
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/portfolio/new");
await new Promise(r => setTimeout(r, 3500));

const info = await tab.eval(() => {
  const r = [...document.querySelectorAll("input[type=radio]")].find(x => x.value === "9");
  if (!r) return { err: "no radio" };
  const lab = r.closest("label");
  const inpRect = r.getBoundingClientRect();
  const labRect = lab.getBoundingClientRect();
  const inpCS = getComputedStyle(r);
  return {
    scrollY: window.scrollY, innerH: window.innerHeight,
    inpRect: { x: inpRect.x, y: inpRect.y, w: inpRect.width, h: inpRect.height },
    labRect: { x: labRect.x, y: labRect.y, w: labRect.width, h: labRect.height },
    inpStyle: { display: inpCS.display, opacity: inpCS.opacity, position: inpCS.position, visibility: inpCS.visibility, pointerEvents: inpCS.pointerEvents },
    labHTML: lab.outerHTML.slice(0, 400),
    atLabCentre: (() => { const e = document.elementFromPoint(labRect.x + labRect.width/2, labRect.y + labRect.height/2); return e ? e.tagName + "." + (e.className||"").toString().slice(0,30) : "null"; })(),
    atInpCentre: (() => { const e = document.elementFromPoint(inpRect.x + inpRect.width/2, inpRect.y + inpRect.height/2); return e ? e.tagName + "." + (e.className||"").toString().slice(0,30) : "null"; })()
  };
});
console.log(JSON.stringify(info, null, 1));

// try clicking the actual input element's rect
if (info.inpRect && info.inpRect.w > 0) {
  const x = info.inpRect.x + info.inpRect.w / 2, y = info.inpRect.y + info.inpRect.h / 2;
  console.log("clicking input rect at", x, y);
  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  await new Promise(r => setTimeout(r, 900));
  console.log("checked now:", JSON.stringify(await tab.eval(() => [...document.querySelectorAll("input[type=radio]")].filter(x => x.checked).map(x => x.value))));
}
process.exit(0);
