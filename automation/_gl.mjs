import { fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/manage_gigs", "manage_gigs");
const s = await tab.eval(() => {
  const t = document.body.innerText;
  const i = t.indexOf("Gigs");
  return { text: t.slice(i, i + 1200), links: [...document.querySelectorAll("a[href*='manage_gigs']")].map(a => a.getAttribute("href")).filter((v,i,s)=>s.indexOf(v)===i).slice(0,10) };
});
console.log(s.text);
console.log("\nlinks:", JSON.stringify(s.links));
await tab.shot("C:/Users/abder/freelance-pack/tools/_gigs_list.png");
process.exit(0);
