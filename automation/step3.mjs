// step3.mjs — find & click "Create new project", then dump the create form
import { Tab } from "./cdp.mjs";

const tab = await Tab.open(/fiverr/);
await tab.goto("https://www.fiverr.com/users/allaouiabder/portfolio");
await tab.eval(() => { document.body.click(); window.scrollTo(0, 0); });

const found = await tab.eval(() => {
  const want = "Create new project";
  const all = [...document.querySelectorAll("a,button,div,span,input[type=submit]")];
  const hits = all.filter(e => (e.innerText || e.value || "").trim() === want);
  return hits.map(e => ({ tag: e.tagName, cls: (e.className || "").toString().slice(0, 70), href: e.getAttribute?.("href") || null }));
});
console.log("matches:", JSON.stringify(found, null, 1));

const clicked = await tab.eval(() => {
  const want = "Create new project";
  const all = [...document.querySelectorAll("a,button,div,span")];
  const el = all.find(e => (e.innerText || "").trim() === want);
  if (!el) return "NOT FOUND";
  el.scrollIntoView({ block: "center" });
  el.click();
  return "clicked " + el.tagName;
});
console.log("click ->", clicked);
await new Promise(r => setTimeout(r, 3000));

const form = await tab.eval(() => ({
  url: location.href,
  inputs: [...document.querySelectorAll("input")].map(i => ({
    type: i.type, name: i.name, id: i.id, ph: i.placeholder,
    label: (i.closest("label")?.innerText || i.getAttribute("aria-label") || "").trim().slice(0, 50)
  })),
  textareas: [...document.querySelectorAll("textarea")].map(t => ({
    name: t.name, id: t.id, ph: t.placeholder, cls: (t.className||"").slice(0,40)
  })),
  selects: [...document.querySelectorAll("select")].map(s => ({ name: s.name, id: s.id, opts: [...s.options].map(o=>o.text.trim()).slice(0,8) })),
  btnTexts: [...document.querySelectorAll("button")].map(b => (b.innerText || "").trim()).filter(Boolean).filter(t => t.length < 40).slice(0, 30),
  text: document.body.innerText.slice(0, 1400)
}));
console.log("\n=== FORM ===\n" + JSON.stringify(form, null, 1).slice(0, 4000));
await tab.shot("C:/Users/abder/freelance-pack/tools/_fiverr_form.png");
process.exit(0);
