// step2.mjs — open portfolio page, click "Create new project", dump the form
import { Tab } from "./cdp.mjs";

const tab = await Tab.open(/fiverr/);
await tab.goto("https://www.fiverr.com/users/allaouiabder/portfolio");
console.log("URL:", tab.info.url);

const page = await tab.eval(() => ({
  text: document.body.innerText.slice(0, 900),
  buttons: [...document.querySelectorAll("button")].map(b => (b.innerText || "").trim()).filter(Boolean).slice(0, 25)
}));
console.log("=== PAGE ===\n" + page.text);
console.log("\n=== BUTTONS ===\n" + page.buttons.join(" | "));

const clicked = await tab.clickText("Create new project", "button");
console.log("\nclick ->", clicked);

await new Promise(r => setTimeout(r, 2500));

const form = await tab.eval(() => ({
  url: location.href,
  inputs: [...document.querySelectorAll("input")].map(i => ({
    type: i.type, name: i.name, id: i.id, ph: i.placeholder,
    label: (i.closest("label")?.innerText || i.getAttribute("aria-label") || "").trim().slice(0, 60)
  })),
  textareas: [...document.querySelectorAll("textarea")].map(t => ({
    name: t.name, id: t.id, ph: t.placeholder,
    label: (t.closest("label")?.innerText || "").trim().slice(0, 60)
  })),
  buttons: [...document.querySelectorAll("button")].map(b => (b.innerText || "").trim()).filter(Boolean).slice(0, 25),
  text: document.body.innerText.slice(0, 1200)
}));
console.log("\n=== FORM ===");
console.log(JSON.stringify(form, null, 1).slice(0, 3500));

await tab.shot("C:/Users/abder/freelance-pack/tools/_fiverr_form.png");
process.exit(0);
