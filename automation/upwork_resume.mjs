// upwork_resume.mjs — resume + finish the Upwork profile wizard (draft is server-side)
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
  "Data Cleaning", "Email Marketing", "List Building", "Python", "Excel",
  "Data Processing", "Data Analysis", "Market Research", "B2B"];

const info = await newTab("https://www.upwork.com/nx/create-profile/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(18000);

async function realClickText(txt, exact = true) {
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
  await wait(1100);
  return "clicked " + txt;
}

const setText = (sel, val) => tab.eval((s, v) => {
  const el = document.querySelector(s);
  if (!el) return "missing " + s;
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.blur();
  return "ok";
}, sel, val);

for (let step = 1; step <= 12; step++) {
  const p = await tab.eval(() => ({
    url: location.href,
    seg: location.pathname.split("/").filter(Boolean).pop(),
    head: document.body.innerText.slice(0, 550).replace(/\n+/g, " | "),
    tas: [...document.querySelectorAll("textarea")].filter(e => e.getClientRects().length).length,
    texts: [...document.querySelectorAll('input[type=text], input:not([type])')].filter(e => e.getClientRects().length).length
  }));
  console.log(`\n===== ${step} :: ${p.seg} =====`);
  console.log(p.head);
  if (/profile is live|all set|congrat/i.test(p.head)) { console.log("*** PROFILE LIVE ***"); break; }

  const seg = p.seg;
  if (seg === "skills") {
    for (const s of SKILLS) {
      const r = await tab.typeInto("skill", s, true);
      await wait(300);
      const has = await tab.eval((t) => document.body.innerText.indexOf(t) >= 0, s);
      console.log("  skill:", s, has ? "ok" : "MISS");
    }
  } else if (seg === "title" || /title/i.test(p.head)) {
    console.log("  title :", await setText('input[type=text], input:not([type])', TITLE));
  } else if (seg === "overview" || p.tas > 0) {
    console.log("  over  :", await setText("textarea", OVERVIEW));
  } else if (p.texts > 0) {
    console.log("  input :", await setText('input[type=text], input:not([type])', TITLE));
  }
  // generic option picks for the remaining steps
  const opt = await tab.eval(() => {
    const want = ["Less than 1 year", "Bachelor", "Master", "Some college", "High school",
      "Less than 30 hours", "10-15 hours", "20-30 hours", "30+ hours",
      "French", "English", "Arabic", "Freelance", "Self-employed", "15", "$15",
      "Full-time", "Part-time", "Yes", "No"];
    const els = [...document.querySelectorAll("label,li,button,a[href='#']")]
      .filter(e => e.getClientRects().length);
    let n = 0;
    for (const w of want) {
      const el = els.find(e => (e.innerText || "").trim().toLowerCase() === w.toLowerCase());
      if (!el) continue;
      const inp = el.querySelector("input[type=radio], input[type=checkbox]");
      if (inp) { if (!inp.checked) { inp.click(); n++; } }
      else { el.click(); n++; }
    }
    return n;
  });
  if (opt) console.log("  opts  :", opt);

  await wait(1000);
  const before = p.url;
  await tab.clickText("Next", "button");
  await wait(9000);
  const after = await tab.eval(() => location.href);
  console.log("  moved :", after !== before ? "YES -> " + after.split("/").pop() : "NO");
  if (after === before) {
    // try the other next button
    const nx2 = await tab.eval(() => {
      const bs = [...document.querySelectorAll("button")].filter(b => b.getClientRects().length && /next|save|continue|create/i.test(b.innerText || ""));
      if (!bs.length) return "no next";
      bs[bs.length - 1].click();
      return "clicked " + bs[bs.length - 1].innerText.trim().slice(0, 30);
    });
    console.log("  alt   :", nx2);
    await wait(9000);
  }
}
try { await tab.shot("C:/Users/abder/freelance-pack/tools/_upw_end.png"); } catch {}
process.exit(0);
