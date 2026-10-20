// open_draft.mjs — open the remaining draft gig in the editor
import { fiverrTab } from "./cdp.mjs";

const tab = await fiverrTab("https://www.fiverr.com/users/allaouiabder/manage_gigs", "manage_gigs");
await new Promise(r => setTimeout(r, 2500));

const rect = await tab.eval(() => {
  const el = [...document.querySelectorAll("a,span,div,p")].find(e =>
    !e.children.length && (e.textContent || "").trim().toLowerCase() === "build verified b2b lead lists for morocco, mena and africa");
  if (!el) return null;
  el.scrollIntoView({ block: "center" });
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, tag: el.tagName, href: el.closest("a")?.getAttribute("href") || null };
});
console.log("target:", JSON.stringify(rect));

if (rect) {
  if (rect.href) {
    await tab.goto(new URL(rect.href, "https://www.fiverr.com").href);
  } else {
    await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: rect.x, y: rect.y });
    await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
    await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  }
  await new Promise(r => setTimeout(r, 4500));
}
console.log("url  :", await tab.eval(() => location.href));
console.log("title:", await tab.eval(() => document.title));
console.log("has title ta:", await tab.eval(() => !!document.querySelector("textarea[maxlength='80']")));
console.log("body :", (await tab.eval(() => document.body.innerText)).slice(0, 300));
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_draft_open.png"); } catch {}
process.exit(0);
