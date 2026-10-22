// step4.mjs — the rest of the create-project form
import { Tab } from "./cdp.mjs";

const tab = await Tab.open(/portfolio\/new/);

const rest = await tab.eval(() => ({
  fileInputs: [...document.querySelectorAll("input[type=file]")].map(i => ({
    name: i.name, accept: i.accept, multiple: i.multiple,
    parentTxt: (i.parentElement?.parentElement?.innerText || "").trim().slice(0, 70)
  })),
  textareas: [...document.querySelectorAll("textarea")].map(t => ({
    name: t.name, ph: t.placeholder, cls: (t.className || "").slice(0, 50)
  })),
  contentEditables: [...document.querySelectorAll("[contenteditable=true]")].map(c => ({
    tag: c.tagName, role: c.getAttribute("role"), ph: c.getAttribute("data-placeholder") || c.getAttribute("placeholder") || "",
    cls: (c.className || "").slice(0, 50)
  })),
  checkboxes: [...document.querySelectorAll("input[type=checkbox]")].map(c => ({
    name: c.name, label: (c.closest("label")?.innerText || "").trim().slice(0, 40)
  })),
  submitBtns: [...document.querySelectorAll("button,input[type=submit]")].map(b => ({
    t: (b.innerText || b.value || "").trim().slice(0, 40),
    disabled: b.disabled
  })).filter(x => x.t && x.t.length < 40),
  // the visible form region text
  formText: (document.querySelector("form")?.innerText || document.body.innerText).slice(0, 1500)
}));
console.log(JSON.stringify(rest, null, 1).slice(0, 4000));
process.exit(0);
