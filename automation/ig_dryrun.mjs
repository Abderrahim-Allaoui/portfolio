// ig_dryrun.mjs — visit each prospect profile, collect real personalisation data,
// and draft the DM. NO messages are sent here.
import { Tab, newTab } from "./cdp.mjs";
import { writeFileSync } from "node:fs";

const wait = (ms) => new Promise(r => setTimeout(r, ms));

const PROSPECTS = [
  { h: "rickscafe_casablanca", name: "Rick's Café", city: "Casablanca", sect: "restaurant" },
  { h: "pastrama.ma", name: "Pastrama", city: "Casablanca", sect: "restaurant" },
  { h: "demoisellecasablanca", name: "Demoiselle Casablanca", city: "Casablanca", sect: "restaurant" },
  { h: "instafoodrabat", name: "Instafood Rabat", city: "Rabat", sect: "food delivery" },
  { h: "sun_brokers_agency", name: "Sun Brokers Agency", city: "Casablanca", sect: "agence immobilière" },
  { h: "emcimmobilier", name: "EMC Immobilier", city: "Casablanca", sect: "agence immobilière" },
  { h: "naji.immobilier", name: "Naji Immobilier", city: "Rabat", sect: "agence immobilière" },
  { h: "oxford_dental_center", name: "Centre Dentaire Oxford", city: "Casablanca", sect: "cabinet dentaire" },
  { h: "clinique_dentaire_casablanca", name: "Clinique Dentaire Casablanca", city: "Casablanca", sect: "cabinet dentaire" },
  { h: "crystal.dentalcliniccasablanca", name: "Crystal Dental Clinic", city: "Casablanca", sect: "cabinet dentaire" },
  { h: "nourfashion.brand", name: "Nour Fashion", city: "Maroc", sect: "e-commerce mode" },
  { h: "lumera.selection", name: "Lumera Maison", city: "Maroc", sect: "e-commerce accessoires" },
  { h: "shopili_m3ak", name: "Shopili", city: "Maroc", sect: "e-commerce" }
];

const info = await newTab("https://www.instagram.com/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(5000);

const out = [];

for (const p of PROSPECTS) {
  const url = `https://www.instagram.com/${p.h}/`;
  await tab.goto(url);
  await wait(4200);

  const d = await tab.eval(() => {
    const t = document.body.innerText;
    const followers = (t.match(/([\d.,]+[KMB]?)\s+followers/i) || [])[1] || null;
    const following = (t.match(/([\d.,]+[KMB]?)\s+following/i) || [])[1] || null;
    const posts = (t.match(/([\d.,]+[KMB]?)\s+posts/i) || [])[1] || null;
    // first post caption
    const art = document.querySelector('article');
    const cap = art ? (art.querySelector("span")?.innerText || "").trim().slice(0, 120) : "";
    const bio = (document.querySelector('section ul, header ul')?.innerText || "").trim().split("\n").slice(0, 4).join(" | ").slice(0, 160);
    const link = document.querySelector('a[href*="http"][target="_blank"]')?.getAttribute("href") || null;
    const hasMsg = !/^(Log in|Log In)/i.test(t.slice(0, 200));
    return { followers, following, posts, cap, bio, link, hasMsg, head: t.slice(0, 160).replace(/\n+/g, " | ") };
  }).catch(e => ({ err: String(e).slice(0, 80) }));

  const rec = { ...p, ...d };
  out.push(rec);
  console.log(`\n=== @${p.h} ===`);
  console.log("  followers:", d.followers, "| posts:", d.posts, "| url:", d.url);
  console.log("  bio      :", (d.bio || "").slice(0, 130));
  console.log("  caption  :", (d.cap || "").slice(0, 110));
  console.log("  link     :", d.link);
  if (d.err) console.log("  ERR:", d.err);
}

writeFileSync("./ig_profiles.json", JSON.stringify(out, null, 1));
console.log("\n\nsaved -> ig_profiles.json");
process.exit(0);
