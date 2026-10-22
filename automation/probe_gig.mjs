// probe_gig.mjs — explore the Fiverr "create new gig" form
import { Tab, fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/manage_gigs");
await new Promise(r => setTimeout(r, 4000));

const page = await tab.eval(() => ({
  url: location.href,
  text: document.body.innerText.slice(0, 900),
  links: [...document.querySelectorAll("a")].map(a => (a.innerText || "").trim() + " => " + a.getAttribute("href"))
    .filter(s => /gig/i.test(s)).slice(0, 10)
}));
console.log("URL:", page.url);
console.log("\nTEXT:\n" + page.text);
console.log("\nGIG LINKS:\n" + page.links.join("\n"));
await tab.shot("C:/Users/abder/freelance-pack/tools/_gigs_page.png");
process.exit(0);
