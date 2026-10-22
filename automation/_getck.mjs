import { Tab, fiverrTab } from "./cdp.mjs";
const tab = await fiverrTab();
const cookies = await tab.send("Network.getCookies", { urls: ["https://www.fiverr.com/"] });
console.log(JSON.stringify(cookies.cookies.map(c => ({ name: c.name, httpOnly: c.httpOnly, secure: c.secure, path: c.path, domain: c.domain, value: c.value.length })), null, 1));
const { writeFileSync } = await import("node:fs");
writeFileSync("./fiverr_cookies.json", JSON.stringify(cookies.cookies, null, 1));
console.log("saved -> fiverr_cookies.json");
process.exit(0);
