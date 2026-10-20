// ig_retry.mjs — retry the DMs whose composer did not load, with longer waits
// and a re-click of the Message button if the panel did not open.
import { Tab, newTab } from "./cdp.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const LOG = "./ig_sent_log.json";

const P = {
  "demoisellecasablanca": "Bonjour, j'ai regardé votre page — menu, pastry shop, plateaux repas, le cote attractif est large. Une question : quand un client commande un plateau repas ou réserve une table via Instagram, est-ce que quelqu'un le rappelle dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit, sans engagement.",
  "instafoodrabat": "Bonjour, j'ai vu votre page — 370 publications, la commande est partout : Instagram, le site, le téléphone. Une question : quand une commande arrive sur un canal et que le client écrit sur un autre, qui suit ? Chez mes clients c'est souvent exactement là que ça se perd. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Si ça vous parle, donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit.",
  "sun_brokers_agency": "Bonjour, j'ai regardé votre page — 1 440 publications et 6 574 abonnés, l'activité ne ralentit pas. Une question sur l'immobilier : quand un client vous écrit sur Instagram ou passe sur le site pour une estimation, est-ce que quelqu'un le rappelle dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit.",
  "emcimmobilier": "Bonjour, j'ai vu votre page — trois agences, Palm Anfa, Palm Zenata et Palm Office, donc trois sources de leads qui ne se parlent pas. Une question : quand un prospect écrit sur une page et va sur le site d'une autre agence, qui le suit ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit.",
  "naji.immobilier": "Bonjour, j'ai vu votre page — presque tout passe par Facebook, la page Instagram reste légère. Une question sur l'immobilier : quand un client vous écrit sur Messenger ou sur le site, est-ce que quelqu'un le rappelle dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit.",
  "crystal.dentalcliniccasablanca": "Bonjour, j'ai vu votre page — horaires affichés, localisation claire, 2 360 abonnés. Une question : quand un patient réserve un RDV via le formulaire du site ou via Instagram, est-ce que quelqu'un le rappelle dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit.",
  "nourfashion.brand": "Bonjour, j'ai vu votre page — 61,5K abonnés et la nouvelle collection en tête. Une question sur la boutique : quand un client écrit pour une taille ou une livraison via Instagram, est-ce que quelqu'un le suit dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit.",
  "lumera.selection": "Bonjour, j'ai vu votre page — Elkebir, Ibraq, Laverne, bakhoor, une vraie sélection. Une question : quand un client écrit pour un article ou une livraison via Instagram, est-ce que quelqu'un le suit dans l'heure ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit.",
  "shopili_m3ak": "Bonjour, j'ai vu votre page — 46,5K abonnés, la marque tourne. Une question : quand un client clique sur le lien WhatsApp pour commander, qui reprend la commande derrière ? Chez mes clients c'est souvent exactement là que ça fuit. Je construis des listes de contacts B2B (décideurs, email vérifié, source citée, bounce sous 3%). Donnez-moi votre segment et je vous envoie 5 contacts en échantillon gratuit."
};

let log = [];
try { log = JSON.parse(readFileSync(LOG, "utf8")); } catch {}
const done = new Set(log.filter(x => /clicked Send/.test(x.status)).map(x => x.h));
const todo = Object.keys(P).filter(h => !done.has(h));
console.log("already sent:", done.size, "| to send:", todo.length);

const info = await newTab("https://www.instagram.com/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(5000);

const findComposer = () => tab.eval(() => {
  const all = [...document.querySelectorAll('[contenteditable="true"][role="textbox"], div[contenteditable="true"]')]
    .filter(e => e.offsetParent !== null);
  if (!all.length) return null;
  const el = all[all.length - 1];
  const r = el.getBoundingClientRect();
  return { x: r.x + 25, y: r.y + r.height / 2, n: all.length };
});

for (let i = 0; i < todo.length; i++) {
  const h = todo[i];
  await tab.goto(`https://www.instagram.com/${h}/`);
  await wait(6500);

  // click Message (retry up to 3x, waiting for the composer each time)
  let comp = null;
  for (let k = 0; k < 3 && !comp; k++) {
    await tab.eval(() => {
      const b = [...document.querySelectorAll("button,a,div[role=button]")].find(e =>
        e.offsetParent !== null && /^(Message|Messenger|Envoyer|Contacter)$/i.test((e.innerText || "").trim()));
      if (b) { b.scrollIntoView({ block: "center" }); b.click(); }
    });
    await wait(3500);
    comp = await findComposer();
    if (!comp) { await wait(3500); comp = await findComposer(); }
  }

  if (!comp) {
    console.log(`[${h}] STILL NO COMPOSER`);
    log.push({ h, status: "no-composer-retry" });
    writeFileSync(LOG, JSON.stringify(log, null, 1));
    continue;
  }

  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: comp.x, y: comp.y, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: comp.x, y: comp.y, button: "left", clickCount: 1 });
  await wait(800);
  await tab.send("Input.insertText", { text: P[h] });
  await wait(2800);

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
  console.log(`[${i + 1}/${todo.length}] @${h} :: typed ${len} :: ${sent}`);
  log.push({ h, status: sent, chars: len });
  writeFileSync(LOG, JSON.stringify(log, null, 1));

  if (i < todo.length - 1) {
    const w = 33000 + Math.floor(Math.random() * 14000);
    console.log("   ... pause " + Math.round(w / 1000) + "s");
    await wait(w);
  }
}
console.log("DONE");
process.exit(0);
