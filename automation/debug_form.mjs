// debug_form.mjs — inspect the radio + industry widget structure
import { Tab } from "./cdp.mjs";

const tab = await Tab.open(/fiverr/);
console.log("url:", tab.info.url);

const info = await tab.eval(() => {
  const out = {};

  // ---- find a radio labelled "October"
  const radios = [...document.querySelectorAll("input[type=radio]")];
  out.radioCount = radios.length;
  out.radioSample = radios.slice(0, 3).map(r => ({
    name: r.name, value: r.value, checked: r.checked,
    id: r.id, cls: (r.className || "").slice(0, 60),
    parentHTML: (r.parentElement?.outerHTML || "").slice(0, 300)
  }));

  // ---- the industry combobox
  const ind = document.querySelector('input[placeholder*="industry" i], input[placeholder*="Industry" i]');
  out.industryFound = !!ind;
  if (ind) {
    out.industryAttrs = {
      tag: ind.tagName, type: ind.type, role: ind.getAttribute("role"),
      ariaExpanded: ind.getAttribute("aria-expanded"),
      ariaControls: ind.getAttribute("aria-controls"),
      cls: (ind.className || "").slice(0, 80),
      parentHTML: (ind.parentElement?.parentElement?.outerHTML || "").slice(0, 700)
    };
  }

  // ---- any listbox / menu open in the DOM?
  out.listboxes = [...document.querySelectorAll("[role=listbox], [role=menu], ul")].map(e => ({
    role: e.getAttribute("role"), hidden: e.offsetParent === null,
    txt: (e.innerText || "").trim().slice(0, 120)
  })).slice(0, 8);

  // ---- "October" label element
  const oct = [...document.querySelectorAll("label,span,div,p")].find(e => (e.innerText || "").trim() === "October");
  out.octoberHTML = oct ? oct.outerHTML.slice(0, 500) : "none";
  out.octoberClosestLabel = oct?.closest("label")?.outerHTML.slice(0, 500) || "none";

  return out;
});
console.log(JSON.stringify(info, null, 1).slice(0, 5000));
process.exit(0);
