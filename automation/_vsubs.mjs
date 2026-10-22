// _vsubs.mjs — open each of the 4 verification sub-tasks and dump its form
import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/verification/user", "fiverr");
await wait(5000);

// step 1: business?
await tab.eval(() => {
  const el = [...document.querySelectorAll("p")].find(e => (e.textContent || "").trim() === "No");
  if (el) el.click();
});
await wait(800);
await tab.clickText("Next", "button");
await wait(3500);

const tasks = ["Verify your phone number", "Add your security question", "Add your personal and business information", "Upload your ID"];

for (const t of tasks) {
  const opened = await tab.eval((name) => {
    const el = [...document.querySelectorAll("p,span,div,a,button")].find(e =>
      !e.children.length && (e.textContent || "").trim() === name);
    if (!el) return "not found";
    el.scrollIntoView({ block: "center" });
    el.click();
    return "clicked";
  }, t);
  await wait(2500);
  const s = await tab.eval(() => ({
    url: location.href,
    head: document.body.innerText.slice(150, 800).replace(/\n+/g, " | "),
    inputs: [...document.querySelectorAll("input")].filter(e => e.offsetParent !== null)
      .map(e => `${e.type}${e.checked ? "*" : ""} ph="${e.placeholder || ""}" lbl="${(e.closest("label")?.innerText || e.parentElement?.parentElement?.innerText || "").trim().split("\n")[0].slice(0, 45)}"`),
    selects: [...document.querySelectorAll("select")].filter(e => e.offsetParent !== null)
      .map(x => `${x.name || "(noname)"}: ${[...x.options].map(o => o.text.trim()).slice(0, 10).join(" | ")}`),
    files: [...document.querySelectorAll("input[type=file]")].map(e => e.accept || "(any)"),
    btns: [...document.querySelectorAll("button,a")].filter(b => b.offsetParent !== null)
      .map(b => (b.innerText || "").trim()).filter(x => x && x.length < 40).slice(0, 10)
  }));
  console.log(`\n########## ${t} ########## (${opened})`);
  console.log("url    :", s.url);
  console.log("head   :", s.head);
  console.log("inputs :", JSON.stringify(s.inputs, null, 1).slice(0, 900));
  if (s.selects.length) console.log("selects:", JSON.stringify(s.selects, null, 1).slice(0, 700));
  console.log("files  :", JSON.stringify(s.files));
  console.log("btns   :", JSON.stringify(s.btns));
  try { await tab.shot(`C:/Users/abder/freelance-pack/tools/_vsub_${t.split(" ").pop()}.png`); } catch {}
}
process.exit(0);
