import { fiverrTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const tab = await fiverrTab("https://www.fiverr.com/account-settings", "fiverr");
await wait(5000);
const r = await tab.eval(() => {
  const all = [...document.querySelectorAll("*")].filter(e => (e.innerText||"").trim() === "Identity verification");
  const t = all[all.length-1];
  if (!t) return { err: "not found", count: all.length };
  const card = t.closest("[class*=card],[class*=section],[class*=setting],li,div");
  const a = (card || t).querySelector("a[href]");
  return { html: (card||t).outerHTML.slice(0,900), href: a?.getAttribute("href") || null };
});
console.log(JSON.stringify(r, null, 1).slice(0,1500));
if (r.href) {
  await tab.goto(r.href.startsWith("http") ? r.href : "https://www.fiverr.com" + r.href);
  await wait(4500);
  const s = await tab.eval(() => ({
    url: location.href, title: document.title,
    text: document.body.innerText.slice(250, 1000),
    files: [...document.querySelectorAll("input[type=file]")].map(e=>e.accept||"(any)"),
    btns: [...document.querySelectorAll("button,a")].filter(b=>b.offsetParent!==null).map(b=>(b.innerText||"").trim()).filter(x=>x&&x.length<40).slice(0,10)
  }));
  console.log("\nURL:", s.url);
  console.log("TEXT:\n" + s.text);
  console.log("files:", JSON.stringify(s.files), "| btns:", JSON.stringify(s.btns));
  try { await tab.shot("C:/Users/abder/freelance-pack/tools/_idpage.png"); } catch {}
}
process.exit(0);
