// shot_repo.mjs — screenshot the live GitHub repo (used as a portfolio attachment)
import { Tab } from "./cdp.mjs";

const tab = await Tab.open(/fiverr|github/);           // reuse any tab
await tab.goto("https://github.com/Abderrahim-Allaoui/portfolio");
await new Promise(r => setTimeout(r, 3000));

// open the repo README view and let images/fonts settle
await tab.eval(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 1500));

await tab.shot("C:/Users/abder/freelance-pack/thumbnails/output/portfolio-0-github.png");
console.log("saved portfolio-0-github.png");

const info = await tab.eval(() => ({
  title: document.title,
  stars: document.body.innerText.match(/Star\s*\d*/)?.[0] || "-",
  files: document.body.innerText.match(/\d+ files?/)?.[0] || "-"
}));
console.log(JSON.stringify(info));
process.exit(0);
