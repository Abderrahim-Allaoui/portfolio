import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://www.upwork.com/nx/create-profile/categories");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(18000);
// click "Fill out manually" if present
await tab.eval(() => { const b=[...document.querySelectorAll("button")].find(x=>/fill out manually/i.test((x.innerText||"").trim())); if(b) b.click(); });
await wait(9000);
const dom = await tab.eval(() => {
  const el = [...document.querySelectorAll("div,span,button,li,a,label")].find(e => !e.children.length && (e.textContent||"").trim() === "Data Science & Analytics");
  if (!el) return { err: "not found" };
  let p = el;
  for (let i=0;i<4;i++) p = p.parentElement;
  return {
    rect: (()=>{const r=el.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};})(),
    tag: el.tagName, cls: (el.className||"").toString().slice(0,60),
    html: p.outerHTML.slice(0, 900)
  };
});
console.log(JSON.stringify(dom, null, 1).slice(0, 2000));
process.exit(0);
