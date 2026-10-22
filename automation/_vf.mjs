import { Tab, fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/portfolio");
await new Promise(r => setTimeout(r, 3500));
const s = await tab.eval(() => {
  const t = document.body.innerText;
  const i = t.indexOf("Portfolio");
  return { count: (t.match(/Showing (\d+) project/) || [])[0] || "?", body: t.slice(i, i + 1200) };
});
console.log("count:", s.count);
console.log(s.body);
await tab.shot("C:/Users/abder/freelance-pack/tools/_portfolio_now.png");
console.log("shot saved");
process.exit(0);
