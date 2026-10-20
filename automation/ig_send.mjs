// ig_send.mjs — send personalised Instagram DMs to the prospects.
//
// Usage:  node ig_send.mjs one   -> sends only the first DM (test)
//         node ig_send.mjs all   -> sends the batch
//
// Opener rules (12-PROSPECTS.md):
//   - lead with a DIAGNOSTIC QUESTION (never "I sell X")
//   - no price, no link, no tool names
//   - reference something REAL seen on the profile
//   - close with the free 5-lead sample offer (same offer as Gig 1)
import { Tab, newTab } from "./cdp.mjs";
import { writeFileSync } from "node:fs";

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const MODE = process.argv[2] || "one";
const LOG = "./ig_sent_log.json";

const P = {
  "rickscafe_casablanca": {
    name: "Rick's Café", city: "Casablanca", sect: "restaurant",
    dm: "Bonjour Rick's Café, j'ai vu votre page — 15,4K abonnés et 222 publications, ça se voit que la salle vit au rythme d'Instagram. Une question sur le restaurant : quand un client réserve via Instagram ou via le formulaire du site, est-ce que quelqu'un le rappelle dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Moi je construis des listes de contacts B2B (décideurs, email vérifié, source citée, taux de bounce sous 3%). Si ça vous parle, donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit, vous jugez la qualité avant de payer quoi que ce soit."
  },
  "pastrama.ma": {
    name: "Pastrama", city: "Casablanca", sect: "restaurant",
    dm: "Bonjour, j'ai vu votre page — 63,1K abonnés, ça fait une belle file. Une question sur le restaurant : quand un client réserve ou commande via Instagram, est-ce que quelqu'un le rappelle dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Si ça vous parle, donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit — vous jugez la qualité avant de payer quoi que ce soit."
  },
  "demoisellecasablanca": {
    name: "Demoiselle Casablanca", city: "Casablanca", sect: "restaurant/pâtisserie",
    dm: "Bonjour, j'ai regardé votre page — menu, pastry shop, plateaux repas, le cote attractif est large. Une question : quand un client commande un plateau repas ou réserve une table via Instagram, est-ce que quelqu'un le rappelle dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit, sans engagement."
  },
  "instafoodrabat": {
    name: "Instafood Rabat", city: "Rabat", sect: "food delivery",
    dm: "Bonjour, j'ai vu votre page — 370 publications, la commande est partout : Instagram, le site, le téléphone. Une question : quand une commande arrive sur un canal et que le client écrit sur un autre, qui suit ? Chez mes clients c'est souvent exactement là que ça se perd. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Si ça vous parle, donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit."
  },
  "sun_brokers_agency": {
    name: "Sun Brokers Agency", city: "Casablanca", sect: "agence immobilière",
    dm: "Bonjour, j'ai regardé votre page — 1 440 publications et 6 574 abonnés, l'activité ne ralentit pas. Une question sur l'immobilier : quand un client vous écrit sur Instagram ou passe sur le site pour une estimation, est-ce que quelqu'un le rappelle dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit."
  },
  "emcimmobilier": {
    name: "EMC Immobilier", city: "Casablanca", sect: "agence immobilière",
    dm: "Bonjour, j'ai vu votre page — trois agences, Palm Anfa, Palm Zenata et Palm Office, donc trois sources de leads qui ne se parlent pas. Une question : quand un prospect écrit sur une page et va sur le site d'une autre agence, qui le suit ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit."
  },
  "naji.immobilier": {
    name: "Naji Immobilier", city: "Rabat", sect: "agence immobilière",
    dm: "Bonjour, j'ai vu votre page — presque tout passe par Facebook, la page Instagram reste légère. Une question sur l'immobilier : quand un client vous écrit sur Messenger ou sur le site, est-ce que quelqu'un le rappelle dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit."
  },
  "oxford_dental_center": {
    name: "Centre Dentaire Oxford", city: "Casablanca", sect: "cabinet dentaire",
    dm: "Salam, qrit l-page dyalkom — 59,5K abonnés, 513 publications. Su'al: mnin patient kay-reservi appointment f Instagram wla f le site, wach kay-3awd l-patient bach n7kmo? F-bzaf d-l-halat hada howa l-mochkil l-kbar. Ana kanbni des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Ila bghiti, 3tini secteur dyalkom w n-sift lik 5 contacts b blan — nchoufou wach l-7e9a mzyan 9bel ma tkhlss chi 7aja."
  },
  "clinique_dentaire_casablanca": {
    name: "Clinique Dentaire Casablanca", city: "Casablanca", sect: "cabinet dentaire / implantologie",
    dm: "Bonjour, j'ai regardé votre page — l'implantologie à part entière. Une question : quand un patient écrit pour un devis ou un implant via Instagram, est-ce que quelqu'un le rappelle dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit."
  },
  "crystal.dentalcliniccasablanca": {
    name: "Crystal Dental Clinic", city: "Casablanca", sect: "cabinet dentaire",
    dm: "Bonjour, j'ai vu votre page — horaires affichés, localisation claire, 2 360 abonnés. Une question : quand un patient réserve un RDV via le formulaire du site ou via Instagram, est-ce que quelqu'un le rappelle dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit."
  },
  "nourfashion.brand": {
    name: "Nour Fashion", city: "Maroc", sect: "e-commerce mode",
    dm: "Bonjour, j'ai vu votre page — 61,5K abonnés et la nouvelle collection en tête. Une question sur la boutique : quand un client écrit pour une taille ou une livraison via Instagram, est-ce que quelqu'un le suit dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit."
  },
  "lumera.selection": {
    name: "Lumera Maison", city: "Maroc", sect: "e-commerce accessoires / parfum",
    dm: "Bonjour, j'ai vu votre page — Elkebir, Ibraq, Laverne, bakhoor, une vraie sélection. Une question : quand un client écrit pour un article ou une livraison via Instagram, est-ce que quelqu'un le suit dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit."
  },
  "shopili_m3ak": {
    name: "Shopili", city: "Maroc", sect: "e-commerce",
    dm: "Bonjour, j'ai vu votre page — 46,5K abonnés, la marque tourne. Une question : quand un client clique sur le lien WhatsApp pour commander, qui reprend la commande derrière ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit."
  }
};

const ORDER = ["rickscafe_casablanca", "pastrama.ma", "demoisellecasablanca",
  "instafoodrabat", "sun_brokers_agency", "emcimmobilier", "naji.immobilier",
  "oxford_dental_center", "clinique_dentaire_casablanca",
  "crystal.dentalcliniccasablanca", "nourfashion.brand", "lumera.selection", "shopili_m3ak"];

const SKIP = new Set(["rickscafe_casablanca"]);   // already sent
const list = MODE === "one" ? ORDER.slice(0, 1) : ORDER.filter(h => !SKIP.has(h));

let log = [];
try { log = JSON.parse((await import("node:fs")).readFileSync(LOG, "utf8")); } catch {}

const info = await newTab("https://www.instagram.com/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(5000);

for (let i = 0; i < list.length; i++) {
  const h = list[i];
  const p = P[h];
  if (!p) { console.log("skip", h); continue; }

  await tab.goto(`https://www.instagram.com/${h}/`);
  await wait(4500);

  const opened = await tab.eval(() => {
    const cands = [...document.querySelectorAll("button,a,div[role=button]")].filter(e => {
      const t = (e.innerText || "").trim();
      return e.offsetParent !== null && /^(Message|Messenger|Envoyer|Contacter)$/i.test(t);
    });
    if (!cands.length) return "NO MESSAGE BUTTON";
    cands[0].scrollIntoView({ block: "center" });
    cands[0].click();
    return "clicked Message";
  });
  await wait(4000);
  if (opened === "NO MESSAGE BUTTON") {
    console.log(`[${h}] ${opened}`);
    log.push({ h, status: "no-message-button" });
    writeFileSync(LOG, JSON.stringify(log, null, 1));
    continue;
  }

  // IG's composer is a contenteditable div[role=textbox] with no label
  const comp = await tab.eval(() => {
    const all = [...document.querySelectorAll('[contenteditable="true"][role="textbox"], div[contenteditable="true"]')]
      .filter(e => e.offsetParent !== null);
    const el = all[all.length - 1];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + 25, y: r.y + r.height / 2, n: all.length };
  });
  if (!comp) {
    console.log(`[${h}] NO COMPOSER`);
    log.push({ h, status: "no-composer" });
    writeFileSync(LOG, JSON.stringify(log, null, 1));
    continue;
  }
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: comp.x, y: comp.y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: comp.x, y: comp.y, button: "left", clickCount: 1 });
  await wait(600);
  await tab.send("Input.insertText", { text: p.dm });
  await wait(2600);

  const len = await tab.eval(() => {
    const all = [...document.querySelectorAll('[contenteditable="true"][role="textbox"], div[contenteditable="true"]')]
      .filter(e => e.offsetParent !== null);
    const el = all[all.length - 1];
    return el ? (el.innerText || el.textContent || "").length : 0;
  });
  if (len < 50) {
    console.log(`[${h}] TYPE FAILED (${len})`);
    log.push({ h, status: "type-failed " + len });
    writeFileSync(LOG, JSON.stringify(log, null, 1));
    continue;
  }

  const sent = await tab.eval(() => {
    const b = [...document.querySelectorAll("button,div[role=button],svg[aria-label],span[aria-label]")].find(e => {
      const t = (e.getAttribute("aria-label") || e.getAttribute("title") || e.innerText || "").trim();
      return e.offsetParent !== null && /^(Send|Envoyer)$/i.test(t);
    });
    if (!b) return "NO SEND BUTTON";
    b.click();
    return "clicked Send";
  });
  await wait(4000);
  console.log(`[${i + 1}/${list.length}] @${h} :: typed ${len} :: ${sent}`);
  log.push({ h, status: sent, chars: len });
  writeFileSync(LOG, JSON.stringify(log, null, 1));

  if (i < list.length - 1) {
    const w = 32000 + Math.floor(Math.random() * 14000);
    console.log("   ... pause " + Math.round(w / 1000) + "s");
    await wait(w);
  }
}
console.log("DONE. log -> ig_sent_log.json");
process.exit(0);
