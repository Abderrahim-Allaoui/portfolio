import { Tab } from "./cdp.mjs";
const tab = await Tab.open(/fiverr/);
await tab.goto("https://www.fiverr.com/users/allaouiabder/portfolio");
const s = await tab.eval(() => ({
  url: location.href,
  signedIn: /Abderrahim A\.|allaouiabder|Complete profile|Portfolio/.test(document.body.innerText.slice(0, 4000)),
  head: document.body.innerText.slice(0, 400)
}));
console.log(JSON.stringify(s, null, 1));
process.exit(0);
