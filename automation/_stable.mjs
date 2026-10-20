import { Tab, fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab();
console.log("tab ok:", tab.info.url);
for (let i = 0; i < 20; i++) {
  const v = await tab.eval(() => 1 + 1);
  if (i % 5 === 0) process.stdout.write(i + " ");
}
console.log("\n20 evals OK");
process.exit(0);
