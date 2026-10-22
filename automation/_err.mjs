import { Tab, fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/manage_gigs/new?wizard=0&tab=general");
await new Promise(r => setTimeout(r, 4500));
const errs = () => tab.eval(() => {
  const out = [];
  for (const e of document.querySelectorAll("*")) {
    if (e.children.length) continue;
    const t = (e.textContent||"").trim();
    const c = (e.className||"").toString();
    if (t && t.length < 90 && /error|missing|required|invalid|at least|must/i.test(c)) out.push({ c: c.slice(0,60), t });
  }
  const cls = document.querySelector("form")?.className || "";
  return { errs: out.slice(0, 15), formCls: cls.slice(0,80) };
});
console.log("before:", JSON.stringify(await errs()));
console.log("save:", await tab.clickText("Save & Continue", "button"));
await new Promise(r => setTimeout(r, 4000));
console.log("after :", JSON.stringify(await errs()));
console.log("url   :", await tab.eval(() => location.href));
await tab.shot("C:/Users/abder/freelance-pack/tools/_gig1_err.png");
process.exit(0);
