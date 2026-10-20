// probe_gig2.mjs — walk the gig wizard and dump every step's fields
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/manage_gigs/new?wizard=0&tab=general");
await new Promise(r => setTimeout(r, 4500));

const dump = () => tab.eval(() => {
  const vis = (e) => e.offsetParent !== null;
  return {
    step: (document.body.innerText.match(/^\d\s*\n\s*([A-Za-z &]+)/m) || [])[0] || "?",
    inputs: [...document.querySelectorAll("input")].filter(vis).map(i => ({
      type: i.type, name: i.name, id: i.id, ph: i.placeholder,
      label: (i.closest("label")?.innerText || i.getAttribute("aria-label") || "").trim().slice(0, 55),
      cls: (i.className || "").toString().slice(0, 30)
    })),
    textareas: [...document.querySelectorAll("textarea")].filter(vis).map(t => ({
      name: t.name, ph: t.placeholder, max: t.maxLength
    })),
    comboboxes: [...document.querySelectorAll('[role=combobox]')].filter(vis).map(c => ({
      name: c.getAttribute("name"), ph: c.querySelector("input")?.placeholder || "",
      val: c.querySelector("input")?.value || ""
    })),
    buttons: [...document.querySelectorAll("button")].filter(vis).map(b => (b.innerText || "").trim()).filter(Boolean).slice(0, 14),
    text: document.body.innerText.slice(0, 1000)
  };
});

for (let s = 1; s <= 6; s++) {
  const d = await dump();
  console.log(`\n########## STEP ${s} ##########`);
  console.log("inputs    :", JSON.stringify(d.inputs));
  console.log("textareas :", JSON.stringify(d.textareas));
  console.log("comboboxes:", JSON.stringify(d.comboboxes));
  console.log("buttons   :", JSON.stringify(d.buttons));
  await tab.shot(`C:/Users/abder/freelance-pack/tools/_gig_step${s}.png`);
  if (s < 6) {
    const nx = await tab.clickText("Next", "button");
    console.log("next ->", nx);
    await new Promise(r => setTimeout(r, 3000));
  }
}
process.exit(0);
