// upwork_fill.mjs — auto-fill the 10-step Upwork profile form
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
I work in Arabic, French and English. Most lead lists for this region are built by someone who cannot read the page they scraped - I can, so the names, titles and company details come out right, and the emails are verified instead of guessed.

Ask me for a free sample of 5 contacts from your niche and judge the quality before you pay anything.`;

const RULES = [
  { re: /category|specialt/i, kind: "text", want: ["Data Science & Analytics", "Data Extraction", "Data Mining", "Lead Generation"] },
  { re: /skill/i, kind: "text", want: ["Data Mining", "Data Extraction", "Web Scraping", "Lead Generation", "Data Cleaning", "Email Marketing", "List Building", "Data Processing", "Python", "Excel"] },
  { re: /title|headline/i, kind: "text", want: [TITLE] },
  { re: /overview|describe|about/i, kind: "text", want: [OVERVIEW] },
  { re: /rate|hourly|price/i, kind: "text", want: ["15", "$15", "Hourly"] },
  { re: /experience/i, kind: "text", want: ["Less than 1 year", "1 year"] },
  { re: /education/i, kind: "text", want: ["Bachelor", "Master", "High school", "Some college"] },
  { re: /availab|hours|week/i, kind: "text", want: ["10", "20", "Less than 30"] },
  { re: /english|french|arabic|language/i, kind: "text", want: ["French", "English", "Arabic"] },
  { re: /work|employ|freelanc/i, kind: "text", want: ["Freelance", "Self-employed"] },
];

const info = await newTab("https://www.upwork.com/nx/create-profile/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(20000);

// ---- skip the 3 questions
await tab.eval(() => {
  const b = [...document.querySelectorAll("button")].find(x => /get started/i.test((x.innerText || "").trim()));
  if (b) b.click();
});
await wait(8000);
await tab.eval(() => {
  const r = [...document.querySelectorAll('input[type=radio]')].find(x => x.value === "NEW_TO_ME");
  if (r) r.click();
});
await wait(800);
await tab.clickText("Next", "button");
await wait(8000);
await tab.eval(() => {
  const r = [...document.querySelectorAll('input[type=radio]')].find(x => x.value === "MAIN_INCOME");
  if (r) r.click();
});
await wait(800);
await tab.clickText("Next", "button");
await wait(8000);
await tab.eval(() => {
  [...document.querySelectorAll('input[type=checkbox]')].filter(x => x.getClientRects().length).forEach(c => { if (!c.checked) c.click(); });
});
await wait(800);
await tab.clickText("Next, create a profile", "button");
await wait(9000);
await tab.eval(() => {
  const b = [...document.querySelectorAll("button")].find(x => /fill out manually/i.test((x.innerText || "").trim()));
  if (b) b.click();
});
await wait(10000);

// ---- walk the form
for (let step = 1; step <= 12; step++) {
  const page = await tab.eval(() => ({
    url: location.href,
    head: document.body.innerText.slice(0, 900).replace(/\n+/g, " | "),
    inputs: [...document.querySelectorAll("input,textarea")].filter(e => e.getClientRects().length)
      .map(e => ({ tag: e.tagName, type: e.type, name: e.name || e.id || "", ph: e.placeholder || "", val: e.value || "" })),
    buttons: [...document.querySelectorAll("button")].filter(b => b.getClientRects().length)
      .map(b => (b.innerText || "").trim()).filter(Boolean).slice(0, 8)
  }));
  console.log(`\n===== STEP ${step} =====`);
  console.log("url  :", page.url);
  console.log("head :", page.head);
  console.log("inputs:", JSON.stringify(page.inputs).slice(0, 400));
  console.log("btns :", JSON.stringify(page.buttons));

  if (/profile is live|your profile is live|all set|congrat/i.test(page.head)) {
    console.log("*** PROFILE CREATED ***");
    break;
  }

  // 1) text inputs / textareas
  const text = await tab.eval((rules) => {
    const head = document.body.innerText;
    const rule = rules.find(r => new RegExp(r.re, r.flags || 'i').test(head));
    const ta = [...document.querySelectorAll("textarea")].filter(e => e.getClientRects().length);
    const ins = [...document.querySelectorAll("input[type=text], input:not([type])")].filter(e => e.getClientRects().length);
    const set = (el, v) => {
      const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    let n = 0;
    if (ta.length && rule) { set(ta[0], rule.want[0]); n++; }
    else if (ta.length) { set(ta[0], OVERVIEW); n++; }
    if (ins.length && rule) { set(ins[0], rule.want[0]); n++; }
    return n;
  }, RULES);
  if (text) console.log("  filled text fields:", text);

  // 2) option lists (radio / checkbox / dropdown)
  const opt = await tab.eval((rules) => {
    const head = document.body.innerText;
    const rule = rules.find(r => new RegExp(r.re, r.flags || 'i').test(head));
    const want = rule ? rule.want : [];
    const labels = [];
    for (const e of document.querySelectorAll("label, li, [role=option], button")) {
      const t = (e.innerText || "").trim();
      if (t && t.length < 60) labels.push({ e, t });
    }
    let hits = 0;
    for (const w of want) {
      const l = labels.find(x => x.t.toLowerCase() === w.toLowerCase())
             || labels.find(x => x.t.toLowerCase().indexOf(w.toLowerCase()) >= 0);
      if (!l) continue;
      const input = l.e.querySelector("input[type=radio], input[type=checkbox]");
      if (input) { if (!input.checked) { input.click(); hits++; } }
      else { l.e.click(); hits++; }
    }
    return hits;
  }, RULES);
  if (opt) console.log("  picked options:", opt);

  await wait(1200);
  const nx = await tab.clickText("Next", "button");
  console.log("  next:", nx);
  await wait(9000);
}
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_upw_done.png"); } catch {}
process.exit(0);
