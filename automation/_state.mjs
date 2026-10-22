// _state.mjs — where are we now? Fiverr + Instagram + Upwork
import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const probe = async (url, name, pick) => {
  const info = await newTab(url);
  const tab = new Tab(info.webSocketDebuggerUrl, info);
  await tab._connect();
  await wait(6500);
  const s = await tab.eval(pick).catch(e => ({ err: String(e).slice(0, 100) }));
  console.log(`\n########## ${name} ##########`);
  console.log(JSON.stringify(s, null, 1).slice(0, 1800));
  return tab;
};

// ---------- FIVERR
await probe("https://www.fiverr.com/users/allaouiabder/seller_dashboard", "FIVERR DASHBOARD", () => {
  const t = document.body.innerText;
  const i = t.indexOf("Complete these steps");
  return {
    url: location.href,
    visible: /not visible yet/i.test(t) ? "NOT VISIBLE" : "VISIBLE",
    strength: (t.match(/Profile Strength\s*\n?(\d+)\s*\n?\/\s*\n?(\d+)/) || []).slice(1).join("/"),
    checklist: t.slice(i, i + 700).replace(/\n+/g, " | "),
    gigs: (t.match(/DRAFT\s*\((\d+)\)/) || [])[1] || null
  };
});

// ---------- FIVERR GIG LIST
await probe("https://www.fiverr.com/users/allaouiabder/manage_gigs", "FIVERR GIGS", () => {
  const t = document.body.innerText;
  const rows = [...document.querySelectorAll("tr")].map(r => (r.innerText || "").replace(/\n+/g, " | ").trim()).filter(x => x.length > 5);
  return { url: location.href, tabs: (t.match(/ACTIVE[\s\S]{0,40}/) || [])[0], rows: rows.slice(0, 6) };
});

// ---------- INSTAGRAM INBOX
await probe("https://www.instagram.com/direct/inbox/", "INSTAGRAM INBOX", () => {
  const t = document.body.innerText;
  const threads = [...document.querySelectorAll('a[href*="/direct/t/"]')].map(a => (a.innerText || "").replace(/\n+/g, " | ").trim()).filter(Boolean);
  return {
    url: location.href,
    youMsgs: (t.match(/You:/g) || []).length,
    threads: [...new Set(threads)].slice(0, 18)
  };
});

// ---------- UPWORK
await probe("https://www.upwork.com/", "UPWORK", () => {
  const t = document.body.innerText;
  return {
    url: location.href,
    signedIn: /My Jobs|My Profile|Notifications|Sign Out/i.test(t),
    head: t.slice(0, 300).replace(/\n+/g, " | ")
  };
});
process.exit(0);
