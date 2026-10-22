import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const info = await newTab("https://www.upwork.com/nx/create-profile/categories");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(20000);

const rect = await tab.eval(() => {
  const el = [...document.querySelectorAll("div,span,button,li,a")].find(e =>
    !e.children.length && (e.textContent||"").trim() === "Data Science & Analytics");
  if (!el) return null;
  el.scrollIntoView({ block: "center" });
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y + r.height/2, w: r.width, h: r.height };
});
console.log("rect:", JSON.stringify(rect));
if (rect) {
  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: rect.x, y: rect.y });
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await wait(2500);
}
const st = await tab.eval(() => ({
  head: document.body.innerText.slice(0, 800).replace(/\n+/g, " | "),
  checked: [...document.querySelectorAll('input[type=checkbox], input[type=radio]')].map(c => `${c.value}=${c.checked}`).slice(0,8),
  btns: [...document.querySelectorAll("button")].filter(b=>b.getClientRects().length).map(b=>(b.innerText||"").trim()).filter(Boolean).slice(0,8)
}));
console.log("head:", st.head);
console.log("checked:", JSON.stringify(st.checked));
console.log("btns:", JSON.stringify(st.btns));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_upw_cat.png"); } catch {}
process.exit(0);
