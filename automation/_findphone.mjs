import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// Fiverr profile contact info
{
  const info = await newTab("https://www.fiverr.com/users/allaouiabder");
  const tab = new Tab(info.webSocketDebuggerUrl, info);
  await tab._connect();
  await wait(6000);
  const s = await tab.eval(() => {
    const t = document.body.innerText;
    const phones = [...new Set(t.match(/(\+?212[\s.-]?[\d\s.-]{8,14})/g) || [])];
    const mails = [...new Set(t.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [])];
    return { phones, mails, head: t.slice(0, 500).replace(/\n+/g, " | ") };
  });
  console.log("FIVERR PROFILE:", JSON.stringify(s, null, 1).slice(0, 1200));
}

// Instagram profile bio
{
  const info = await newTab("https://www.instagram.com/abdo.99all/");
  const tab = new Tab(info.webSocketDebuggerUrl, info);
  await tab._connect();
  await wait(6500);
  const s = await tab.eval(() => {
    const t = document.body.innerText;
    const phones = [...new Set(t.match(/(\+?212[\s.-]?[\d\s.-]{8,14})/g) || [])];
    return { phones, head: t.slice(0, 700).replace(/\n+/g, " | ") };
  });
  console.log("\nINSTAGRAM:", JSON.stringify(s, null, 1).slice(0, 1200));
}
process.exit(0);
