// _vsubs2.mjs — open security-question + personal-info sub-tasks, dump the forms
import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/verification/user", "fiverr");
await wait(5000);

// close any open modal
await tab.eval(() => {
  const x = [...document.querySelectorAll("button")].find(b => (b.getAttribute("aria-label") || "").toLowerCase().includes("close"));
  if (x) x.click();
});
await wait(800);

const openTask = async (name) => {
  const r = await tab.eval((n) => {
    const el = [...document.querySelectorAll("p,span,div,a,button")].find(e =>
      !e.children.length && (e.textContent || "").trim() === n);
    if (!el) return "not found";
    el.scrollIntoView({ block: "center" });
    el.click();
    return "clicked";
  }, name);
  await wait(2500);
  return r;
};

const dump = async (label) => {
  const s = await tab.eval(() => {
    const dlg = [...document.querySelectorAll("[role=dialog]")].filter(d => d.offsetParent !== null);
    const scope = dlg.length ? dlg[dlg.length - 1] : document;
    return {
      dlgText: dlg.length ? dlg[dlg.length - 1].innerText.replace(/\n+/g, " | ").slice(0, 500) : null,
      inputs: [...scope.querySelectorAll("input")].filter(e => e.offsetParent !== null).map(e => {
        const lbl = (e.closest("label")?.innerText || e.parentElement?.innerText || "").trim().split("\n")[0];
        return `${e.type} ph="${e.placeholder || ""}" lbl="${lbl.slice(0, 45)}" val="${(e.value || "").slice(0, 22)}"`;
      }),
      selects: [...scope.querySelectorAll("select")].filter(e => e.offsetParent !== null)
        .map(x => `${x.name || "(noname)"}: ${[...x.options].map(o => o.text.trim()).slice(0, 12).join(" | ")}`),
      radios: [...scope.querySelectorAll("input[type=radio]")].filter(e => e.offsetParent !== null)
        .map(e => { const l = e.closest("label")?.innerText || e.parentElement?.innerText || ""; return (l || e.value).trim().split("\n")[0].slice(0, 45); }),
      files: [...scope.querySelectorAll("input[type=file]")].map(e => e.accept || "(any)")
    };
  });
  console.log(`\n########## ${label} ##########`);
  if (s.dlgText) console.log("dialog :", s.dlgText);
  console.log("inputs :", JSON.stringify(s.inputs, null, 1).slice(0, 1100));
  if (s.selects.length) console.log("selects:", JSON.stringify(s.selects, null, 1).slice(0, 700));
  if (s.radios.length) console.log("radios :", JSON.stringify(s.radios, null, 1).slice(0, 500));
  console.log("files  :", JSON.stringify(s.files));
  return s;
};

console.log("open sec-q:", await openTask("Add your security question"));
await dump("SECURITY QUESTION");
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_v_sec.png"); } catch {}

console.log("\nopen personal:", await openTask("Add your personal and business information"));
await dump("PERSONAL INFO");
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_v_pers.png"); } catch {}
process.exit(0);
