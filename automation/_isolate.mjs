import { Tab, fiverrTab } from "./cdp.mjs";
import { join } from "node:path";
const alive = async () => { try { const r = await fetch("http://127.0.0.1:9333/json/version"); return !!(await r.json()); } catch { return false; } };
const tab = await fiverrTab();
await tab.goto("https://www.fiverr.com/users/allaouiabder/portfolio/new");
await new Promise(r => setTimeout(r, 3000));
console.log("1. after goto, alive:", await alive());

const n = await tab.eval(() => document.querySelectorAll("input").length);
console.log("2. eval ok, inputs =", n, "alive:", await alive());

try { await tab.shot("C:/Users/abder/freelance-pack/tools/_t_shot.png"); console.log("3. screenshot OK, alive:", await alive()); }
catch (e) { console.log("3. screenshot FAILED:", String(e).slice(0,80), "alive:", await alive()); }

try {
  const f = [join("C:/Users/abder/freelance-pack", "thumbnails/output/portfolio-1-maps-scraper.png")];
  await tab.setFiles("input[type=file][name=attachments]", f);
  console.log("4. 1 file set OK, alive:", await alive());
} catch (e) { console.log("4. upload FAILED:", String(e).slice(0,80), "alive:", await alive()); }
await new Promise(r => setTimeout(r, 3000));
console.log("5. after wait, alive:", await alive());
try { const c = await tab.eval(() => document.querySelectorAll("input[type=file]")[0]?.files?.length); console.log("   files attached:", c, "alive:", await alive()); } catch(e){ console.log("   eval failed:", String(e).slice(0,80)); }
process.exit(0);
