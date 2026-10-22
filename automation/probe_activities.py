# probe_activities.py — find every activity that actually has results, ranked by size
import re, html as H, urllib.request, ssl, urllib.parse, time, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
CTX = ssl.create_default_context(); CTX.check_hostname = False; CTX.verify_mode = ssl.CERT_NONE

def fetch(u, t=25):
    try:
        return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t, context=CTX).read().decode("utf-8", "replace")
    except Exception:
        return ""

h = open(os.path.join(HERE, "_home.html"), encoding="utf-8").read()
cands = set()
for a in re.findall(r"activite=([A-Za-z0-9 %'\-&#\.]+)", h):
    a = H.unescape(a).split("&")[0].replace("+", " ").strip()
    if not a or "&" in a or "%" in a: continue
    if len(a) < 4 or len(a) > 42: continue
    if a.lower() in ("ville", "p", "", "activite"): continue
    if any(ch in a for ch in "€¦™&"): continue
    cands.add(a)

print("candidates:", len(cands), flush=True)
res = []
for a in sorted(cands):
    q = urllib.parse.quote_plus(a)
    pg = fetch(f"https://www.marocannuaire.org/Annuaire/Activite.php?activite={q}&domaine=Service")
    if not pg:
        continue
    t = re.search(r"totalRows_re_aff_dernier_anscri_index=(\d+)", pg)
    tot = int(t.group(1)) if t else 0
    if tot > 0:
        res.append((tot, a))
        print(f"{tot:>6}  {a}", flush=True)
    time.sleep(0.15)

res.sort(reverse=True)
json.dump([a for t, a in res], open(os.path.join(HERE, "_activities.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("\nTOTAL activities with results:", len(res), flush=True)
print("TOP 30:", flush=True)
for t, a in res[:30]:
    print(f"  {t:>6}  {a}", flush=True)
