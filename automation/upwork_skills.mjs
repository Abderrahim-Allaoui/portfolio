// upwork_skills.mjs — add skills by typing + Enter, then walk the remaining steps
import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const TITLE = "B2B Lead Generation & Data Extraction Specialist | Arabic, French, English";
const OVERVIEW = `You have data scattered across websites, PDFs and spreadsheets, and someone on your team is moving it by hand. I fix that.

I build verified B2B lead lists and the automation that keeps them fresh. Every lead carries a named decision-maker, a checked email address and the source URL it came from, so nothing is a guess.

WHAT I DO
- B2B lead generation for Morocco, the Maghreb, the Gulf and West Africa
- Web scraping and data extraction (Python, Playwright, Scrapy, Beautiful Soup)
- Excel / Google Sheets cleaning, de-duplication and enrichment
- List hygiene: email repair, phone normalisation to E.164, date normalisation
- Outreach copy in Arabic, French and English

HOW I WORK
1. You send the spec, or we define it together in a 10-minute call
2. I confirm scope, price and delivery date in writing
3. I deliver working output, with a short screen recording showing it runs
4. One round of revisions included

WHY ME
I work in Arabic, French and English. Most lead lists for this region are built by someone who cannot read the page they scraped - I can, so names, titles and company details come out right, and the emails are verified instead of guessed.

Ask me for a free sample of 5 contacts from your niche and judge the quality before you pay anything.`;

const SKILLS = ["Data Extraction", "Data Mining", "Web Scraping", "Lead Generation",
  "Data Cleaning", "Email Marketing", "List Building", "Python", "Market Research",
  "B2B", "Data Analysis", "Data Processing"];

const info = await newTab("https://www.upwork.com/nx/create-profile/skills");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(20000);

// find the skills search input
const inp = await tab.eval(() => {
  const els = [...document.querySelectorAll("input")].filter(e => e.getClientRects().length);
  const cand = els.find(e => /skill|search|type/i.test((e.placeholder || "") + (e.getAttribute("aria-label") || ""))) || els[0];
  if (!cand) return null;
  cand.setAttribute("data-skills", "1");
  return { id: cand.id, ph: cand.placeholder, aria: cand.getAttribute("aria-label") };
});
console.log("skills input:", JSON.stringify(inp));

for (const s of SKILLS) {
  // focus, clear, type the skill, press Enter
  const ok = await tab.eval(() => {
    // the input is re-created after every chip, so find it again each time
    const els = [...document.querySelectorAll("input")].filter(e => e.getClientRects().length);
    const el = els.find(e => /skill/i.test(e.placeholder || ""));
    if (!el) return "gone";
    el.setAttribute("data-skills", "1");
    el.focus();
    el.click();
    return "ok";
  });
  if (ok !== "ok") { console.log("  ", s, ok); break; }
  // clear with the native setter (react-controlled) then let react re-render
  await tab.eval(() => {
    const el = document.querySelector("[data-skills='1']");
    if (!el) return;
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    set.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await wait(400);
  await tab.send("Input.insertText", { text: s });
  await wait(900);
  await tab.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await tab.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await wait(700);
  const has = await tab.eval((t) => document.body.innerText.indexOf(t) >= 0, s);
  console.log("  skill:", s, has ? "added" : "NOT added");
}

const chips = await tab.eval(() => {
  const t = document.body.innerText;
  const i = t.indexOf("Your skills");
  return t.slice(i, i + 300).replace(/\n+/g, " | ");
});
console.log("skills now:", chips);
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_upw_skills.png"); } catch {}
process.exit(0);
