import { fiverrTab } from "./cdp.mjs";
const U = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=1&tab=pricing";
const tab = await fiverrTab(U, "manage_gigs");
await new Promise(r => setTimeout(r, 4000));
const out = await tab.eval(() => {
  // find the embedded redux state
  const keys = Object.keys(window).filter(k => /state|store|__/i.test(k));
  const st = window.__INITIAL_STATE__ || window.__PRELOADED_STATE__ || window.__NEXT_DATA__;
  if (!st) return { keys, err: "no state" };
  const gig = st.gig || (st.regular_pricing && st.regular_pricing.gig) || {};
  const g = gig.gig || gig;
  const pick = (o) => { if (!o || typeof o !== "object") return o; const r = {}; for (const k of Object.keys(o)) { if (/^(packages|description|faq|requirements|pricing|title|tags|category|metadata|attributes|delivery|revisions)/i.test(k)) r[k] = o[k]; } return r; };
  return { keys, top: Object.keys(st), gigKeys: Object.keys(g), pick: pick(g) };
});
console.log(JSON.stringify(out, null, 1).slice(0, 3000));
process.exit(0);
