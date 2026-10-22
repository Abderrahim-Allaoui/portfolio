import { listTargets } from "./cdp.mjs";
const t = await listTargets();
console.log("tabs:", t.length);
for (const x of t) console.log("  ", (x.title||"").slice(0,34), "|", (x.url||"").slice(0,72));
