// _fix2.mjs — add the 3 requirement questions (modal flow) + verify gallery
import { fiverrTab } from "./cdp.mjs";
import { readFileSync } from "node:fs";

const GIG = JSON.parse(readFileSync("./gig1.json", "utf8"));
const EDIT = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab(`${EDIT}?wizard=3&tab=requirements`, "manage_gigs");
await wait(4500);

for (let i = 0; i < GIG.requirements.length; i++) {
  const opened = await tab.eval(() => {
    const b = [...document.querySelectorAll("button,a")].find(x => /add new question/i.test((x.innerText || "").trim()));
    if (!b) return "no button";
    b.click();
    return "opened";
  });
  await wait(1500);
  if (opened !== "opened") { console.log("  req add:", opened); break; }

  const modal = await tab.eval(() => {
    const dlg = [...document.querySelectorAll("[role=dialog]")].find(d => d.offsetParent !== null);
    if (!dlg) return { err: "no dialog" };
    const ins = [...dlg.querySelectorAll("input")].filter(e => e.offsetParent !== null);
    const tas = [...dlg.querySelectorAll("textarea")].filter(e => e.offsetParent !== null);
    const btns = [...dlg.querySelectorAll("button")].filter(b => b.offsetParent !== null).map(b => (b.innerText || "").trim()).filter(Boolean);
    return { inputs: ins.length, textareas: tas.length, btns, html: dlg.innerHTML.slice(0, 700) };
  });
  console.log("  modal:", JSON.stringify(modal).slice(0, 320));

  const filled = await tab.eval((pair) => {
    const dlg = [...document.querySelectorAll("[role=dialog]")].find(d => d.offsetParent !== null);
    if (!dlg) return "no dialog";
    const ins = [...dlg.querySelectorAll("input")].filter(e => e.offsetParent !== null);
    const tas = [...dlg.querySelectorAll("textarea")].filter(e => e.offsetParent !== null);
    const q = ins[ins.length - 1];
    if (q) {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      set.call(q, pair[0]);
      q.dispatchEvent(new Event("input", { bubbles: true }));
      q.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const a = tas[tas.length - 1];
    if (a) {
      const setT = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
      setT.call(a, pair[1]);
      a.dispatchEvent(new Event("input", { bubbles: true }));
      a.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return "q=" + (q ? "yes" : "no") + " a=" + (a ? "yes" : "no");
  }, GIG.requirements[i]);
  console.log("  req[" + i + "]:", filled);
  await wait(800);

  const saved = await tab.eval(() => {
    const dlg = [...document.querySelectorAll("[role=dialog]")].find(d => d.offsetParent !== null);
    const scope = dlg || document;
    const b = [...scope.querySelectorAll("button")].find(x => /^(add|save|create|ok)$/i.test((x.innerText || "").trim()));
    if (!b) return "no confirm button";
    b.click();
    return "clicked " + b.innerText.trim();
  });
  console.log("  confirm:", saved);
  await wait(1500);
}
await tab.clickText("Save", "button");
await wait(3000);
console.log("REQ textareas now:", await tab.eval(() => [...document.querySelectorAll("textarea")].filter(e => e.offsetParent !== null).map(t => (t.value||"").slice(0, 40))));

// gallery check
await tab.goto(`${EDIT}?wizard=4&tab=gallery`);
await wait(5000);
const g = await tab.eval(() => {
  const imgs = [...document.querySelectorAll("img")].map(i => i.src).filter(s => /cloudinary/.test(s) && !/profile_photo/.test(s));
  const files = document.querySelector("input[type=file]");
  return { n: imgs.length, srcs: [...new Set(imgs)].slice(0, 8).map(s => s.split("/").pop().slice(0, 40)) };
});
console.log("\nGALLERY:", JSON.stringify(g, null, 1));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_gallery.png"); } catch {}
process.exit(0);
