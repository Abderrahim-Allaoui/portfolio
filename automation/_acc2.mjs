import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/account-settings", "fiverr");
await wait(5000);
const s = await tab.eval(() => {
  const t = document.body.innerText;
  const out = [];
  for (const e of document.querySelectorAll("a,button,h2,h3,h4,div,span")) {
    if (e.offsetParent === null) continue;
    const x = (e.innerText || "").trim();
    if (x && x.length < 60 && /verif|identi|personal|document|payment|withdraw|tax|address|phone/i.test(x)) out.push(e.tagName + ":" + x);
  }
  return {
    url: location.href, title: document.title,
    items: [...new Set(out)].slice(0, 18),
    text: t.slice(200, 1200),
    files: document.querySelectorAll("input[type=file]").length
  };
});
console.log("url:", s.url);
console.log("ITEMS:\n" + s.items.join("\n"));
console.log("\nTEXT:\n" + s.text);
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_acct2.png"); } catch {}
process.exit(0);
