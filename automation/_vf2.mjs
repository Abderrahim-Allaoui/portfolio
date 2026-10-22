import { Tab, fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/portfolio");
await new Promise(r => setTimeout(r, 4000));
const s = await tab.eval(() => {
  const t = document.body.innerText;
  const titles = [...document.querySelectorAll("a[href*='/portfolio/']")].map(a => (a.innerText||"").trim().split("\n")[0]).filter(Boolean);
  return {
    count: (t.match(/Showing (\d+) project/) || [])[0],
    titles: [...new Set(titles)],
    imgs: [...document.querySelectorAll("img")].map(i => i.src).filter(s => s.includes("fiverr") || s.includes("cdn")).slice(0, 8)
  };
});
console.log("count :", s.count);
console.log("titles:", JSON.stringify(s.titles, null, 1));
console.log("imgs  :", JSON.stringify(s.imgs, null, 1));
await tab.shot("C:/Users/abder/freelance-pack/tools/_portfolio_final.png");
console.log("shot saved");
process.exit(0);
