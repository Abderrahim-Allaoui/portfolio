// _state2.mjs — IG inbox (proper wait) + Fiverr verification phone step
import { Tab, newTab } from "./cdp.mjs";
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ---------- INSTAGRAM
{
  const info = await newTab("https://www.instagram.com/direct/inbox/");
  const tab = new Tab(info.webSocketDebuggerUrl, info);
  await tab._connect();
  await wait(9000);
  const s = await tab.eval(() => {
    const t = document.body.innerText;
    const links = [...document.querySelectorAll('a[href*="/direct/t/"]')].map(a => ({
      href: a.getAttribute("href"), txt: (a.innerText || "").replace(/\n+/g, " | ").trim().slice(0, 70)
    }));
    return {
      youMsgs: (t.match(/You:/g) || []).length,
      youInMsgs: (t.match(/You:/g) || []).length,
      head: t.slice(0, 900).replace(/\n+/g, " | "),
      links: links.slice(0, 15)
    };
  });
  console.log("########## INSTAGRAM ##########");
  console.log(JSON.stringify(s, null, 1).slice(0, 2500));
  try { await tab.shot("C:/Users/abder/freelance-pack/tools/_ig_now.png"); } catch {}
}

// ---------- FIVERR verification: phone step
{
  const info = await newTab("https://www.fiverr.com/verification/user");
  const tab = new Tab(info.webSocketDebuggerUrl, info);
  await tab._connect();
  await wait(6000);

  // answer the business question, then open the phone sub-task
  const r = await tab.eval(() => {
    const opts = [...document.querySelectorAll("p")].filter(e => /^(No|Yes, and I)/.test((e.textContent || "").trim()));
    if (opts.length) { opts[0].click(); return "answered: " + opts[0].textContent.trim(); }
    return "no business question (maybe already past it)";
  });
  console.log("\nstep1:", r);
  await wait(1200);
  await tab.clickText("Next", "button");
  await wait(3500);

  // open "Verify your phone number"
  const opened = await tab.eval(() => {
    const el = [...document.querySelectorAll("p,span,div")].find(e =>
      !e.children.length && (e.textContent || "").trim() === "Verify your phone number");
    if (!el) return "not found";
    el.scrollIntoView({ block: "center" });
    el.click();
    return "clicked";
  });
  console.log("phone step:", opened);
  await wait(3500);

  const ph = await tab.eval(() => {
    const dlg = [...document.querySelectorAll("[role=dialog]")].filter(d => d.offsetParent !== null);
    const scope = dlg.length ? dlg[dlg.length - 1] : document;
    return {
      dlgText: dlg.length ? dlg[dlg.length - 1].innerText.replace(/\n+/g, " | ").slice(0, 500) : null,
      inputs: [...scope.querySelectorAll("input")].filter(e => e.offsetParent !== null)
        .map(e => `${e.type} ph="${e.placeholder || ""}" val="${(e.value || "").slice(0, 24)}" name="${e.name || ""}"`),
      selects: [...scope.querySelectorAll("select")].filter(e => e.offsetParent !== null)
        .map(s => `${s.name || "(noname)"}: ${[...s.options].map(o => o.text.trim()).slice(0, 14).join(" | ")}`),
      btns: [...scope.querySelectorAll("button")].filter(b => b.offsetParent !== null)
        .map(b => (b.innerText || "").trim()).filter(x => x && x.length < 40).slice(0, 8)
    };
  });
  console.log("\nPHONE FORM:\n" + JSON.stringify(ph, null, 1).slice(0, 1800));
  try { await tab.shot("C:/Users/abder/freelance-pack/tools/_phone_now.png"); } catch {}
}
process.exit(0);
