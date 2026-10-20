// probe_industry.mjs — find how the industry listbox renders
import { Tab } from "./cdp.mjs";

const tab = await Tab.open(/fiverr/);

await tab.eval(() => {
  const cb = document.querySelector('[role=combobox][name=industries]');
  cb.scrollIntoView({ block: "center" });
  cb.click();
});
await new Promise(r => setTimeout(r, 1500));

const probe = await tab.eval(() => {
  const out = {};
  out.roles = {};
  for (const el of document.querySelectorAll("[role]")) {
    const r = el.getAttribute("role");
    out.roles[r] = (out.roles[r] || 0) + 1;
  }
  // every element whose text is exactly a known industry
  const names = ["Data", "Programming & Tech", "AI Services", "Business", "Marketing", "Consulting", "Writing & Translation"];
  const found = [];
  for (const n of names) {
    const els = [...document.querySelectorAll("*")].filter(e => e.children.length === 0 && (e.textContent || "").trim() === n);
    found.push({ n, count: els.length, first: els[0] ? {
      tag: els[0].tagName, cls: (els[0].className || "").toString().slice(0, 50),
      vis: els[0].offsetParent !== null,
      parentRole: els[0].parentElement?.getAttribute("role"),
      parentTag: els[0].parentElement?.tagName
    } : null });
  }
  out.found = found;
  // listbox content
  const lb = document.querySelector('[role=listbox]');
  out.listbox = lb ? { txt: (lb.innerText || "").slice(0, 400), children: lb.children.length, html: lb.outerHTML.slice(0, 600) } : null;
  // the combobox html
  const cb = document.querySelector('[role=combobox][name=industries]');
  out.cbHTML = cb ? cb.outerHTML.slice(0, 1200) : null;
  return out;
});
console.log(JSON.stringify(probe, null, 1).slice(0, 4500));
process.exit(0);
