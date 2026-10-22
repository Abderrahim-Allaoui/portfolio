// cleanup_tabs.mjs — close the duplicate/junk tabs (Opera keeps dying with 40+ tabs)
const PORT = 9444;

const list = async () => (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json())
  .filter(t => t.type === "page");

let targets = await list();
console.log("before:", targets.length);

// keep: the Fiverr dashboard, the gig editor, the Instagram inbox, the coach app
const KEEP = [
  /seller_dashboard/,
  /manage_gigs\/build-verified/,
  /direct\/inbox/,
  /iphone-coach/,
  /upwork\.com\/$/,
  /upwork\.com\/nx\/signup/,
  /gmail/,
  /outlook/
];
let closed = 0;
for (const t of targets) {
  if (KEEP.some(r => r.test(t.url))) continue;
  try {
    await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`);
    closed++;
  } catch {}
}
console.log("closed:", closed);
targets = await list();
console.log("after:", targets.length);
for (const t of targets) console.log("  ", (t.title || "").slice(0, 34), "|", (t.url || "").slice(0, 70));
