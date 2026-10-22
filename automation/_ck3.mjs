import { readFileSync } from "node:fs";
const ck = JSON.parse(readFileSync("./fiverr_cookies.json", "utf8"));
for (const c of ck) if (["access_token","_fiverr_session_key"].includes(c.name)) console.log(c.name + "=" + c.value);
