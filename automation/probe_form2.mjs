// probe_form2.mjs â€” dump every form control with name/value/type/checked
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/portfolio/new");
await new Promise(r => setTimeout(r, 3000));
const out = await tab.eval(() => {
  const forms = [...document.querySelectorAll("form")];
  const ctrl = [...document.querySelectorAll("input,select,textarea")].map(e => ({
    tag: e.tagName, type: e.type, name: e.name, value: e.value,
    checked: e.checked, cls: (e.className || "").toString().slice(0, 35)
  }));
  return {
    url: location.href,
    formCount: forms.length,
    formNames: forms.map(f => (f.getAttribute("name") || f.getAttribute("id") || f.className || "").toString().slice(0, 60)),
    controls: ctrl,
    radioGroups: (() => {
      const g = {};
      document.querySelectorAll("input[type=radio]").forEach(r => {
        g[r.name] = g[r.name] || [];
        g[r.name].push(r.value);
      });
      return g;
    })(),
    selects: [...document.querySelectorAll("select")].map(s => ({
      name: s.name, id: s.id, value: s.value,
      opts: [...s.options].map(o => o.value + "=" + o.text.trim()).slice(0, 10)
    }))
  };
});
console.log(JSON.stringify(out, null, 1).slice(0, 5000));
process.exit(0);
