// _id2.mjs — locate the ID verification page
import { Tab, listTargets, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const cands = [
  "https://www.fiverr.com/users/allaouiabder/account_settings",
  "https://www.fiverr.com/users/allaouiabder/verification",
  "https://www.fiverr.com/users/allaouiabder/personal_information",
  "https://www.fiverr.com/users/allaouiabder/verification/identity"
];

for (const u of cands) {
  const info = await newTab(u);
  const tab = new Tab(info.webSocketDebuggerUrl, info);
  await tab._connect();
  await wait(4000);
  const s = await tab.eval(() => {
    const t = document.body.innerText;
    return {
      url: location.href,
      title: document.title,
      head: t.slice(0, 260).replace(/\n+/g, " | "),
      idMention: /identi|verif|passport|licence|identity card|national id|CNIE/i.test(t),
      files: document.querySelectorAll("input[type=file]").length
    };
  }).catch(e => ({ err: String(e).slice(0, 90) }));
  console.log("\n>> " + u);
  console.log(JSON.stringify(s, null, 1).slice(0, 700));
}
process.exit(0);
