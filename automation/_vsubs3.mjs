// _vsubs3.mjs — open sub-tasks by clicking the radio CIRCLE, then dump the form
import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/verification/user", "fiverr");
await wait(5000);

const openCircle = async (label) => {
  const r = await tab.eval((n) => {
    const t = [...document.querySelectorAll("p")].find(e => (e.textContent || "").trim() === n);
    if (!t) return "label not found";
    // the circle is the sibling div with the round border
    const row = t.parentElement?.parentElement;
    const circle = row?.querySelector("div._1rtxvgq1j") || row?.querySelector('div[style*="border-radius"]');
    if (!circle) return "circle not found";
    circle.scrollIntoView({ block: "center" });
    circle.click();
    return "clicked circle";
  }, label);
  await wait(2500);
  return r;
};

const dump = async (label) => {
  const s = await tab.eval(() => {
    const dlg = [...document.querySelectorAll("[role=dialog]")].filter(d => d.offsetParent !== null);
    const scope = dlg.length ? dlg[dlg.length - 1] : document;
    return {
      dlg: dlg.length ? dlg[dlg.length - 1].innerText.replace(/\n+/g, " | ").slice(0, 600) : null,
      inputs: [...scope.querySelectorAll("input")].filter(e => e.offsetParent !== null).map(e => {
        const lbl = (e.closest("label")?.innerText || e.parentElement?.innerText || "").trim().split("\n")[0];
        return `${e.type} ph="${e.placeholder || ""}" lbl="${lbl.slice(0, 48)}" val="${(e.value || "").slice(0, 24)}"`;
      }),
      selects: [...scope.querySelectorAll("select")].filter(e => e.offsetParent !== null)
        .map(x => `${x.name || "(noname)"}: ${[...x.options].map(o => o.text.trim()).slice(0, 14).join(" | ")}`),
      radios: [...scope.querySelectorAll("input[type=radio]")].filter(e => e.offsetParent !== null)
        .map(e => { const l = e.closest("label")?.innerText || e.parentElement?.innerText || ""; return (l || e.value).trim().split("\n")[0].slice(0, 50); }),
      files: [...scope.querySelectorAll("input[type=file]")].map(e => e.accept || "(any)"),
      btns: [...scope.querySelectorAll("button,a")].filter(b => b.offsetParent !== null)
        .map(b => (b.innerText || "").trim()).filter(x => x && x.length < 40).slice(0, 8)
    };
  });
  console.log(`\n########## ${label} ##########`);
  if (s.dlg) console.log("dialog :", s.dlg);
  console.log("inputs :", JSON.stringify(s.inputs, null, 1).slice(0, 1200));
  if (s.selects.length) console.log("selects:", JSON.stringify(s.selects, null, 1).slice(0, 800));
  if (s.radios.length) console.log("radios :", JSON.stringify(s.radios, null, 1).slice(0, 500));
  console.log("files  :", JSON.stringify(s.files), "| btns:", JSON.stringify(s.btns));
  return s;
};

console.log("open sec :", await openCircle("Add your security question"));
await dump("SECURITY QUESTION");
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_v2_sec.png"); } catch {}

console.log("\nopen pers:", await openCircle("Add your personal and business information"));
await dump("PERSONAL INFO");
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_v2_pers.png"); } catch {}

console.log("\nopen id  :", await openCircle("Upload your ID"));
await dump("UPLOAD ID");
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_v2_id.png"); } catch {}
process.exit(0);
