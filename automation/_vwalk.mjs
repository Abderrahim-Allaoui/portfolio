// _vwalk.mjs — walk the whole Fiverr verification flow, dump every step
import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/verification/user", "fiverr");
await wait(5000);

for (let step = 1; step <= 7; step++) {
  const s = await tab.eval(() => {
    const opts = [...document.querySelectorAll("p,li,label,span")].filter(e =>
      !e.children.length && (e.textContent || "").trim() && e.offsetParent !== null &&
      e.closest("main, [role=main], .uw-sl__content, div")).map(e => (e.textContent || "").trim());
    const uniq = [...new Set(opts)].filter(t =>
      t.length < 70 && !/Fiverr|verification|marketplace|help|why is|important|copyright|©|language|filters|sign out|switch|profile|refer|account|billing|english|usd|skip to|enable access|open the|newsletter|privacy|terms|contact|careers|investor|affiliates|press|creator|invite|fiverr pro|blog|forum|community|guides|answers|orders|gigs|earnings|analytics|dashboard/i.test(t));
    return {
      url: location.href,
      head: document.body.innerText.slice(150, 700).replace(/\n+/g, " | "),
      options: uniq.slice(0, 10),
      inputs: [...document.querySelectorAll("input")].filter(e => e.offsetParent !== null)
        .map(e => `${e.type} ph="${e.placeholder || ""}"`),
      selects: [...document.querySelectorAll("select")].filter(e => e.offsetParent !== null)
        .map(x => `${x.name || "(noname)"}: ${[...x.options].map(o => o.text.trim()).slice(0, 12).join(" | ")}`),
      files: document.querySelectorAll("input[type=file]").length
    };
  });

  console.log(`\n########## STEP ${step} ##########`);
  console.log("url    :", s.url);
  console.log("head   :", s.head);
  console.log("options:", JSON.stringify(s.options));
  console.log("inputs :", JSON.stringify(s.inputs));
  console.log("selects:", JSON.stringify(s.selects));
  console.log("files  :", s.files);

  if (s.files > 0) { console.log("\n>>> FILE UPLOAD STEP — stopping here"); break; }

  // answer: prefer the option that matches, else the first one
  const answer = await tab.eval((prefer) => {
    const all = [...document.querySelectorAll("p,li,label,span")].filter(e =>
      !e.children.length && (e.textContent || "").trim() && e.offsetParent !== null);
    const hit = all.find(e => new RegExp(prefer, "i").test((e.textContent || "").trim()))
             || all.find(e => /primary job|sole employee|individual|personal|freelance/i.test((e.textContent || "").trim()));
    if (!hit) return "no option";
    hit.scrollIntoView({ block: "center" });
    hit.click();
    return "clicked: " + hit.textContent.trim().slice(0, 50);
  }, step === 1 ? "As part of my primary job" : ".");
  console.log("answer :", answer);
  await wait(900);

  const nx = await tab.clickText("Next", "button");
  console.log("next   :", nx);
  await wait(3500);
  if (nx.includes("NOT FOUND")) { console.log("no Next — flow ended"); break; }
}
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_vend.png"); } catch {}
process.exit(0);
