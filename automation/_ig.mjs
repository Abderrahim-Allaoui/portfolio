// _ig.mjs — is Instagram logged in in the user's browser?
import { Tab, listTargets, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const targets = await listTargets();
console.log("open tabs:");
for (const t of targets.filter(x => x.type === "page")) console.log("  ", (t.url || "").slice(0, 90));

const info = await newTab("https://www.instagram.com/");
const tab = new Tab(info.webSocketDebuggerUrl, info);
await tab._connect();
await wait(6000);
const s = await tab.eval(() => {
  const t = document.body.innerText;
  return {
    url: location.href,
    title: document.title,
    loggedIn: !/Log in|Log In|Sign Up/i.test(t.slice(0, 600)),
    head: t.slice(0, 400).replace(/\n+/g, " | ")
  };
});
console.log("\nINSTAGRAM:", JSON.stringify(s, null, 1));
process.exit(0);
