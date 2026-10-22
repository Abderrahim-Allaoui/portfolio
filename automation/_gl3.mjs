import { fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/manage_gigs", "manage_gigs");
// click the first draft title
const clicked = await tab.eval(() => {
  const els = [...document.querySelectorAll("*")].filter(e => !e.children.length &&
    (e.textContent||"").trim().toLowerCase() === "build verified b2b lead lists for morocco, mena and africa");
  if (!els.length) return "not found";
  els[0].scrollIntoView({ block: "center" });
  els[0].click();
  return "clicked (" + els.length + " found)";
});
console.log(clicked);
await new Promise(r => setTimeout(r, 4000));
console.log("url  :", await tab.eval(() => location.href));
console.log("title:", await tab.eval(() => document.title));
console.log("has title ta:", await tab.eval(() => !!document.querySelector("textarea[maxlength='80']")));
console.log("body :", (await tab.eval(() => document.body.innerText)).slice(0, 400));
process.exit(0);
