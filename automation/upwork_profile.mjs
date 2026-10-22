// upwork_profile.mjs — walk the Upwork profile wizard (3 questions) and reach the profile form
import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const info = await newTab("https://www.upwork.com/nx/create-profile/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(20000);

const dump = async (tag) => {
  const d = await tab.eval(() => ({
    url: location.href,
    head: document.body.innerText.slice(0, 700).replace(/\n+/g, " | "),
    inputs: [...document.querySelectorAll("input,textarea")].filter(e => e.getClientRects().length)
      .map(e => `${e.tagName}/${e.type || ""} name="${e.name || e.id || ""}" ph="${(e.placeholder || "").slice(0, 34)}" val="${(e.value || "").slice(0, 22)}"`),
    buttons: [...document.querySelectorAll("button")].filter(b => b.getClientRects().length)
      .map(b => (b.innerText || "").trim()).filter(Boolean).slice(0, 10)
  }));
  console.log(`\n===== ${tag} =====`);
  console.log("url   :", d.url);
  console.log("head  :", d.head);
  console.log("inputs:\n  " + d.inputs.join("\n  "));
  console.log("buttons:", JSON.stringify(d.buttons));
  return d;
};

await tab.eval(() => {
  const b = [...document.querySelectorAll("button")].find(x => /get started/i.test((x.innerText || "").trim()));
  if (b) b.click();
});
await wait(9000);

// Q1: brand new
console.log("Q1:", await tab.eval(() => {
  const r = [...document.querySelectorAll('input[type=radio]')].find(x => x.value === "NEW_TO_ME");
  if (!r) return "radio missing";
  r.click();
  return "NEW_TO_ME";
}));
await wait(900);
await tab.clickText("Next", "button");
await wait(9000);
await dump("Q2");

// Q2 / Q3: pick the first sensible option and advance
for (const step of ["Q3", "Q4"]) {
  const picked = await tab.eval(() => {
    const rs = [...document.querySelectorAll('input[type=radio]')].filter(x => x.getClientRects().length);
    if (rs.length) {
      // prefer a data/tech/scraping option if present
      const labels = rs.map(r => {
        const lab = (r.closest("label")?.innerText || r.parentElement?.innerText || "").trim();
        return { r, lab };
      });
      const good = labels.find(l => /data|scrap|program|tech|web|software|analys|market/i.test(l.lab));
      const pick = good || labels[0];
      pick.r.click();
      return "picked: " + pick.lab.slice(0, 50);
    }
    const cb = [...document.querySelectorAll('input[type=checkbox]')].filter(x => x.getClientRects().length);
    if (cb.length) { cb.slice(0, 4).forEach(c => c.click()); return "checked " + Math.min(4, cb.length) + " boxes"; }
    return "nothing to pick";
  });
  console.log(`  ${step} pick:`, picked);
  await wait(900);
  const nx = await tab.clickText("Next", "button");
  console.log(`  ${step} next:`, nx);
  await wait(9000);
  await dump(step);
  if (nx.includes("NOT FOUND")) break;
}
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_upw_final.png"); } catch {}
process.exit(0);
