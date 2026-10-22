// upwork_fill2.mjs — walk the 10-step Upwork profile form with real mouse clicks
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

const WANT = {
  categories: ["Data Science & Analytics"],
  specialty: ["Data Extraction", "Data Mining", "Lead Generation"],
  skills: ["Data Mining", "Data Extraction", "Web Scraping", "Lead Generation", "Data Cleaning", "List Building", "Email Marketing", "Python"],
  experience: ["Less than 1 year"],
  education: ["Bachelor's Degree", "Master's Degree", "Some college"],
  availability: ["Less than 30 hours", "10-15 hours", "20-30 hours"],
  language: ["French", "English", "Arabic"],
  work: ["Freelance", "Self-employed"]
};

const info = await newTab("https://www.upwork.com/nx/create-profile/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(20000);

// skip the 3 questions
await tab.eval(() => {
  const b = [...document.querySelectorAll("button")].find(x => /get started/i.test((x.innerText || "").trim()));
  if (b) b.click();
});
await wait(8000);
await tab.eval(() => {
  const r = [...document.querySelectorAll('input[type=radio]')].find(x => x.value === "NEW_TO_ME");
  if (r) r.click();
});
await wait(700);
await tab.clickText("Next", "button");
await wait(8000);
await tab.eval(() => {
  const r = [...document.querySelectorAll('input[type=radio]')].find(x => x.value === "MAIN_INCOME");
  if (r) r.click();
});
await wait(700);
await tab.clickText("Next", "button");
await wait(8000);
await tab.eval(() => {
  [...document.querySelectorAll('input[type=checkbox]')].filter(x => x.getClientRects().length).forEach(c => { if (!c.checked) c.click(); });
});
await wait(700);
await tab.clickText("Next, create a profile", "button");
await wait(9000);
await tab.eval(() => {
  const b = [...document.querySelectorAll("button")].find(x => /fill out manually/i.test((x.innerText || "").trim()));
  if (b) b.click();
});
await wait(11000);

// real-click a visible element whose text matches exactly
async function realClickText(txt, exact = true) {
  // 1) find + scroll
  const found = await tab.eval((t, ex) => {
    const el = [...document.querySelectorAll("div,span,button,li,a,label")]
      .filter(e => !e.children.length && e.getClientRects().length)
      .find(e => {
        const s = (e.textContent || "").trim();
        return ex ? s === t : s.toLowerCase().indexOf(t.toLowerCase()) >= 0;
      });
    if (!el) return false;
    el.scrollIntoView({ block: "center" });
    return true;
  }, txt, exact);
  if (!found) return "NOT FOUND: " + txt;
  await wait(700);
  // 2) measure AFTER the scroll settled
  const rect = await tab.eval((t, ex) => {
    const el = [...document.querySelectorAll("div,span,button,li,a,label")]
      .filter(e => !e.children.length && e.getClientRects().length)
      .find(e => {
        const s = (e.textContent || "").trim();
        return ex ? s === t : s.toLowerCase().indexOf(t.toLowerCase()) >= 0;
      });
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, txt, exact);
  if (!rect) return "NOT FOUND (2): " + txt;
  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: rect.x, y: rect.y });
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await wait(1200);
  return "clicked " + txt;
}

const setText = (sel, val) => tab.eval((s, v) => {
  const el = document.querySelector(s);
  if (!el) return "missing " + s;
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return "ok";
}, sel, val);

for (let step = 1; step <= 11; step++) {
  const p = await tab.eval(() => ({
    url: location.href,
    head: document.body.innerText.slice(0, 600).replace(/\n+/g, " | "),
    tas: [...document.querySelectorAll("textarea")].filter(e => e.getClientRects().length).length,
    texts: [...document.querySelectorAll('input[type=text], input:not([type])')].filter(e => e.getClientRects().length).length
  }));
  console.log(`\n===== STEP ${step} ===== ${p.url.slice(0, 70)}`);
  console.log(p.head);
  if (/profile is live|all set|congrat|successfully/i.test(p.head)) { console.log("*** PROFILE LIVE ***"); break; }

  // category step
  if (/select 1 category/i.test(p.head)) {
    console.log("  cat   :", await realClickText("Data Science & Analytics"));
    await wait(1500);
    for (const s of WANT.specialty) console.log("  spec  :", await realClickText(s, false));
  } else if (/skill/i.test(p.head) && p.texts === 0 && p.tas === 0) {
    for (const s of WANT.skills) { const r = await realClickText(s, false); if (!r.includes("NOT FOUND")) { await wait(350); } }
  } else if (p.tas > 0) {
    console.log("  ta    :", await setText("textarea", OVERVIEW));
  } else if (p.texts > 0) {
    console.log("  input :", await setText('input[type=text], input:not([type])', TITLE));
  }

  await wait(1000);
  const before = p.url;
  const nx = await tab.clickText("Next", "button");
  console.log("  next  :", nx);
  await wait(9000);
  const after = await tab.eval(() => location.href);
  console.log("  moved :", after !== before ? "YES" : "no (same url)");
}
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_upw_end.png"); } catch {}
process.exit(0);
