// probe_industry2.mjs — try the dropdown button + real key events
import { Tab } from "./cdp.mjs";

const tab = await Tab.open(/fiverr/);

// 1) focus the input, clear it
await tab.eval(() => {
  const inp = document.querySelector('input[placeholder*="industry" i]');
  inp.scrollIntoView({ block: "center" });
  inp.focus();
  inp.click();
});
await tab.send("Input.dispatchKeyEvent", { type: "keyDown", key: "a", code: "KeyA", modifiers: 2 });
await tab.send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", modifiers: 2 });
await tab.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace" });
await tab.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace" });
await new Promise(r => setTimeout(r, 600));

// 2) real typing
for (const ch of "data") {
  await tab.send("Input.insertText", { text: ch });
  await new Promise(r => setTimeout(r, 120));
}
await new Promise(r => setTimeout(r, 1800));

const probe = await tab.eval(() => {
  const out = {};
  out.inputVal = document.querySelector('input[placeholder*="industry" i]')?.value;
  out.expanded = document.querySelector('[role=combobox][name=industries]')?.getAttribute("aria-expanded");
  // any element whose own text starts with "Data"
  const all = [...document.querySelectorAll("body *")];
  const hits = all.filter(e => {
    const t = (e.textContent || "").trim();
    return e.children.length === 0 && /^Data/i.test(t) && t.length < 40;
  }).map(e => ({ tag: e.tagName, role: e.getAttribute("role"), t: e.textContent.trim(), vis: e.offsetParent !== null, cls: (e.className||"").toString().slice(0,40) }));
  out.hits = hits.slice(0, 10);
  // portals
  out.dialogs = [...document.querySelectorAll("[role=dialog]")].map(d => ({
    vis: d.offsetParent !== null, txt: (d.innerText || "").trim().slice(0, 200)
  })).filter(d => d.vis);
  out.listboxNow = [...document.querySelectorAll("[role=listbox],[role=option]")].map(e => e.getAttribute("role") + ":" + (e.innerText||"").trim().slice(0,30));
  return out;
});
console.log(JSON.stringify(probe, null, 1).slice(0, 3500));
await tab.shot("C:/Users/abder/freelance-pack/tools/_industry.png");
process.exit(0);
