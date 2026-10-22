import { fiverrTab } from "./cdp.mjs";
const U = "https://www.fiverr.com/users/allaouiabder/manage_gigs/build-verified-b2b-lead-lists-for-morocco-mena-and-africa/edit?wizard=1&tab=pricing";
const tab = await fiverrTab(U, "manage_gigs");
await new Promise(r => setTimeout(r, 4000));
const w = await tab.eval(() => {
  const dds = [...document.querySelectorAll(".additional-dropdown")].filter(e => e.offsetParent !== null);
  return dds.map((e, i) => {
    // nearest preceding label text in the same row
    let row = e.closest("tr") || e.parentElement?.parentElement;
    const rowTxt = (row?.innerText || "").replace(/\n+/g, " | ").slice(0, 70);
    return { i, txt: (e.innerText || "").trim().slice(0, 20), row: rowTxt };
  });
});
console.log(JSON.stringify(w, null, 1).slice(0, 2200));
process.exit(0);
