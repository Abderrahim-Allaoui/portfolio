#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Morocco B2B Directory Scraper — a REAL lead list with PUBLISHED emails.
==========================================================================
Source: www.marocannuaire.org (public Moroccan business directory, 900+
categories, 1000+ results per category for the big ones).

Each listing publishes: company, activity/sector, city, address, phone, email
and website. The email is PUBLISHED BY THE DIRECTORY — not guessed from an
info@/contact@ pattern. That is the difference between a deliverable lead list
and a spreadsheet of guesses.

Pagination: Activite.php?pageNum_re_aff_dernier_anscri_index=N
             (N is a result offset, ~21-29 new companies per page)

Output: morocco_b2b_list.xlsx + .csv
Run:   python scrape_morocco.py            # all activities
       python scrape_morocco.py "Restaurants" "Cafes"   # selected ones
"""
import csv
import html as H
import os
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36")
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

# ---- activities discovered by probe_activities.py (221 of them have results)
_ACT_FILE = os.path.join(HERE, "_activities.json")
if os.path.exists(_ACT_FILE):
    import json
    with open(_ACT_FILE, encoding="utf-8") as f:
        ACTIVITIES = json.load(f)
else:
    ACTIVITIES = ["Agences immobilieres", "Transport et logistique", "Restaurants",
                  "E-commerce", "Docteur", "Assurances", "Electricite", "Textile"]

# keyword -> Fiverr-facing sector label
SECTOR_RULES = [
    ("immobilier", "Immobilier"), ("promotion immobiliere", "Immobilier"),
    ("notaire", "Juridique"), ("avocat", "Juridique"), ("expertise", "Juridique"),
    ("banque", "Banque & Finance"), ("assurance", "Assurances"), ("fiduciaire", "Banque & Finance"),
    ("expert comptable", "Comptabilite"), ("comptable", "Comptabilite"),
    ("credit-bail", "Banque & Finance"), ("conseil aux entreprises", "Conseil"),
    ("services aux entreprises", "Conseil"), ("communication", "Marketing & Com"),
    ("publicite", "Marketing & Com"), ("marketing", "Marketing & Com"), ("presse", "Marketing & Com"),
    ("imprimerie", "Marketing & Com"), ("edition", "Marketing & Com"),
    ("docteur", "Medecine"), ("dentiste", "Medecine"), ("clinique", "Medecine"),
    ("medecin", "Medecine"), ("laboratoire", "Medecine"), ("pharmacie", "Medecine"),
    ("parapharmacie", "Medecine"), ("veterinaire", "Medecine"), ("optique", "Medecine"),
    ("ambulance", "Medecine"), ("centre hospitalier", "Medecine"),
    ("cosmetique", "Beaute & Mode"), ("esthetique", "Beaute & Mode"),
    ("textile", "Textile & Mode"), ("habillement", "Textile & Mode"),
    ("couture", "Textile & Mode"), ("broderie", "Textile & Mode"),
    ("bijouterie", "Bijoux & Artisanat"), ("peinture", "Bijoux & Artisanat"),
    ("artisanat", "Bijoux & Artisanat"), ("argan", "Bijoux & Artisanat"),
    ("bois", "Industrie & BTP"), ("construction", "Industrie & BTP"),
    ("beton", "Industrie & BTP"), ("carrelage", "Industrie & BTP"),
    ("menuiserie", "Industrie & BTP"), ("chauffage", "Industrie & BTP"),
    ("climatisation", "Industrie & BTP"), ("froid", "Industrie & BTP"),
    ("plomberie", "Industrie & BTP"), ("electricite", "Industrie & BTP"),
    ("materiaux", "Industrie & BTP"), ("travaux", "Industrie & BTP"),
    ("ciment", "Industrie & BTP"), ("marbre", "Industrie & BTP"),
    ("ascenseur", "Industrie & BTP"), ("architecture", "Industrie & BTP"),
    ("ingenieur", "Industrie & BTP"), ("metallurgie", "Industrie & BTP"),
    ("chaudronnerie", "Industrie & BTP"), ("plastique", "Industrie & BTP"),
    ("electronique", "Industrie & BTP"), ("electromenager", "Industrie & BTP"),
    ("electrique", "Industrie & BTP"), ("mecanique", "Industrie & BTP"),
    ("materiel industriel", "Industrie & BTP"), ("machines", "Industrie & BTP"),
    ("quincaillerie", "Industrie & BTP"), ("metal", "Industrie & BTP"),
    ("transport", "Transport & Logistique"), ("logistique", "Transport & Logistique"),
    ("transitaire", "Transport & Logistique"), ("agence maritime", "Transport & Logistique"),
    ("importateur", "Import-Export"), ("import-export", "Import-Export"),
    ("negoce import", "Import-Export"), ("export", "Import-Export"),
    ("restaurant", "Restaurants"), ("traiteur", "Restaurants"),
    ("boulangerie", "Restaurants"), ("patisserie", "Restaurants"),
    ("cafe", "Restaurants"), ("pizzeria", "Restaurants"), ("hotel", "Hotellerie"),
    ("riad", "Hotellerie"), ("auberges", "Hotellerie"), ("residence touristique", "Hotellerie"),
    ("e-commerce", "E-commerce"), ("boutique", "E-commerce"),
    ("nettoyage", "Services"), ("deratisation", "Services"), ("securite", "Services"),
    ("surveillance", "Services"), ("recrutement", "RH & Services"),
    ("agence de recrutement", "RH & Services"), ("centre d'appel", "RH & Services"),
    ("formation", "Formation"), ("enseignement", "Formation"), ("sport", "Sport & Loisirs"),
    ("club sport", "Sport & Loisirs"), ("loisirs", "Sport & Loisirs"),
    ("piscine", "Sport & Loisirs"), ("evenement", "Evenements"),
    ("photograph", "Evenements"), ("location de voiture", "Automobile"),
    ("automobile", "Automobile"), ("motocycle", "Automobile"),
    ("agence de voyage", "Tourisme"), ("guide touristique", "Tourisme"),
    ("translation", "Traduction"), ("traducteur", "Traduction"),
    ("interieur", "Immobilier"), ("decoration", "Immobilier"),
    ("agencement", "Immobilier"), ("ameublement", "Immobilier"),
    ("agroalimentaire", "Agro"), ("agriculture", "Agro"), ("agro", "Agro"),
    ("cereale", "Agro"), ("semence", "Agro"), ("minoterie", "Agro"),
    ("engrais", "Agro"), ("conserve", "Agro"), ("aliment", "Agro"),
    ("phytosanitaire", "Agro"), ("bovin", "Agro"), ("volaille", "Agro"),
    ("fruits", "Agro"), ("legume", "Agro"), ("aviculture", "Agro"),
    ("petro", "Energie"), ("energie", "Energie"), ("combustible", "Energie"),
    ("gaz et propane", "Energie"), ("electricite de", "Energie"),
    ("irrigation", "Agro"), ("pepiniere", "Agro"), ("carburant", "Energie"),
    ("stockage", "Energie"), ("pneumatique", "Automobile"),
    ("moteur", "Automobile"), ("moteur", "Automobile"),
]


def sector_for(activity):
    a = activity.lower()
    for kw, sec in SECTOR_RULES:
        if kw in a:
            return sec
    return "Autres"

MAX_PAGES = 45          # per activity
DELAY = 0.6             # polite pause between requests

HEAD_RE = re.compile(
    r'<h3>\s*<a[^>]*href="Details_infos\.php\?e=([^"&]*)[^"]*"[^>]*>(.*?)</a>', re.S)
ADDR_RE = re.compile(r'<ul>\s*<li>(.*?)</li>\s*</ul>', re.S)
P_RE = re.compile(r'<p>(.*?)</p>', re.S)
TAG_RE = re.compile(r'<(?:br|/p|/li|div)[^>]*>', re.I)
CITY_RE = re.compile(r'<div class="top-post-info-extra">(.*?)</div>', re.S)
EMAIL_RE = re.compile(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}')
PHONE_RE = re.compile(r'(?:\+212|0[5-7])[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}')
SITE_RE = re.compile(r'www\.[A-Za-z0-9.\-]+\.[A-Za-z]{2,}')
ID_RE = re.compile(r'[?&]id=(\d+)')
TOTAL_RE = re.compile(r'totalRows_re_aff_dernier_anscri_index=(\d+)')


def fetch(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": UA,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
            })
            return urllib.request.urlopen(req, timeout=35, context=CTX).read().decode("utf-8", "replace")
        except Exception:
            if i == tries - 1:
                return ""
            time.sleep(1.5 * (i + 1))
    return ""


def clean(s):
    s = TAG_RE.sub("\n", s or "")
    s = re.sub(r"<[^>]+>", " ", s)
    s = H.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def parse_blocks(page, activity, sector):
    rows = []
    heads = list(HEAD_RE.finditer(page))
    src = ("https://www.marocannuaire.org/Annuaire/Activite.php?activite="
           + urllib.parse.quote_plus(activity) + "&domaine=Service")
    for i, m in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else min(len(page), m.start() + 4000)
        blk = page[m.start():end]
        name = clean(m.group(2)).split("|")[0].strip()
        if not name or len(name) < 3:
            continue
        addr = ""
        am = ADDR_RE.search(blk)
        if am:
            addr = clean(am.group(1))
        phone = email = site = ""
        pm = P_RE.search(blk)
        if pm:
            ptxt = clean(pm.group(1))
            em = EMAIL_RE.search(ptxt)
            if em:
                email = em.group(0).lower()
            ph = PHONE_RE.search(ptxt)
            if ph:
                phone = ph.group(0)
            sm = SITE_RE.search(ptxt)
            if sm:
                site = sm.group(0)
        city = ""
        # the city is in the Details_infos URL: ...&ville=CASABLANCA&...
        vm = re.search(r"[?&]ville=([^&\"]+)", m.group(0) or "")
        if vm:
            city = urllib.parse.unquote_plus(H.unescape(vm.group(1))).replace("%20", " ").strip()
        if not city:
            cm = CITY_RE.search(blk)
            if cm:
                c2 = re.search(r"<label[^>]*>(.*?):", cm.group(1), re.S)
                if c2:
                    city = clean(c2.group(1))
        city = re.sub(r"\s+", " ", city).title() if city.isupper() else city
        idm = ID_RE.search(m.group(0) or "")
        rows.append({
            "company": name,
            "sector": sector,
            "activity": activity,
            "city": city,
            "address": addr,
            "phone": phone,
            "email": email,
            "email_status": "PUBLISHED" if email else "",
            "website": site,
            "source_id": idm.group(1) if idm else "",
            "source_url": src,
        })
    return rows


def main():
    only = sys.argv[1:] or list(ACTIVITIES)
    cols = ["company", "sector", "activity", "city", "address", "phone", "email",
            "email_status", "website", "source_id", "source_url"]
    out_csv = os.path.join(HERE, "morocco_b2b_list.csv")

    # ---- resume: keep whatever a previous run already saved
    all_rows, seen = [], set()
    if os.path.exists(out_csv):
        with open(out_csv, encoding="utf-8-sig") as f:
            for r in csv.DictReader(f):
                all_rows.append(r)
                seen.add((r["company"].lower().strip(), r["city"].lower().strip(), r["phone"]))
        print(f"resumed with {len(all_rows)} rows already scraped", flush=True)

    if not os.path.exists(out_csv):
        with open(out_csv, "w", newline="", encoding="utf-8-sig") as f:
            csv.DictWriter(f, fieldnames=cols).writeheader()

    for act in only:
        if not act:
            continue
        sector = sector_for(act)
        q = urllib.parse.quote_plus(act)
        page0 = fetch(f"https://www.marocannuaire.org/Annuaire/Activite.php?activite={q}&domaine=Service")
        if not page0:
            print(f"[skip] {act}", flush=True)
            continue
        tm = TOTAL_RE.search(page0)
        total = int(tm.group(1)) if tm else 0
        n_new = 0
        for p in range(MAX_PAGES):
            if p == 0:
                pg = page0
            else:
                time.sleep(DELAY)
                pg = fetch(
                    "https://www.marocannuaire.org/Annuaire/Activite.php?"
                    f"pageNum_re_aff_dernier_anscri_index={p}"
                    f"&totalRows_re_aff_dernier_anscri_index={total or 1016}"
                    f"&activite={q}&domaine=Service")
                if not pg:
                    break
            rows = parse_blocks(pg, act, sector)
            got = 0
            for r in rows:
                key = (r["company"].lower().strip(), r["city"].lower().strip(), r["phone"])
                if key in seen:
                    continue
                seen.add(key)
                all_rows.append(r)
                got += 1
            n_new += got
            if got == 0:
                break
        print(f"[{act:<34}] total={total:<6} new={n_new:<5} | running={len(all_rows)}", flush=True)
        # append incrementally so a kill never loses the whole run
        with open(out_csv, "a", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=cols)
            for r in all_rows[-n_new:] if n_new else []:
                w.writerow(r)

    with_email = [r for r in all_rows if r["email"]]
    print(f"\nTOTAL rows: {len(all_rows)} | with PUBLISHED email: {len(with_email)}", flush=True)
    print("sectors:", len(set(r["sector"] for r in all_rows)),
          "| cities:", len(set(r["city"] for r in all_rows if r["city"])), flush=True)

    with open(out_csv, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for r in all_rows:
            w.writerow(r)
    print("CSV  ->", out_csv, flush=True)

    try:
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill, Alignment
        from openpyxl.utils import get_column_letter
        wb = Workbook()
        ws = wb.active
        ws.title = "Morocco B2B"
        fill = PatternFill("solid", fgColor="1F4E78")
        for c, name in enumerate(cols, 1):
            cell = ws.cell(row=1, column=c, value=name)
            cell.font = Font(bold=True, color="FFFFFF", size=11)
            cell.fill = fill
        for r, row in enumerate(all_rows, 2):
            for c, name in enumerate(cols, 1):
                ws.cell(row=r, column=c, value=row.get(name, ""))
        widths = {"company": 36, "sector": 16, "activity": 30, "city": 15, "address": 46,
                  "phone": 18, "email": 32, "email_status": 13, "website": 30,
                  "source_id": 10, "source_url": 58}
        for c, name in enumerate(cols, 1):
            ws.column_dimensions[get_column_letter(c)].width = widths[name]
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions

        s = wb.create_sheet("Summary")
        s["A1"] = "Morocco B2B directory scrape"
        s["A1"].font = Font(bold=True, size=14, color="1F4E78")
        info = [("Generated", str(date.today())),
                ("Rows", len(all_rows)),
                ("With PUBLISHED email", len(with_email)),
                ("Sectors", len(set(r["sector"] for r in all_rows))),
                ("Cities", len(set(r["city"] for r in all_rows if r["city"]))),
                ("Source", "www.marocannuaire.org (public directory)"),
                ("", ""),
                ("NOTE", "email_status = PUBLISHED means the address is published by the directory itself, not guessed."),
                ("", "Verify bounce/SMTP before sending, and respect each company's ToS.")]
        for i, (k, v) in enumerate(info, 3):
            s.cell(row=i, column=1, value=k).font = Font(bold=True)
            s.cell(row=i, column=2, value=v)
        wb.save(os.path.join(HERE, "morocco_b2b_list.xlsx"))
        print("XLSX ->", os.path.join(HERE, "morocco_b2b_list.xlsx"), flush=True)
    except ImportError:
        print("[!] openpyxl missing -> CSV only", flush=True)

    print("DONE", flush=True)


if __name__ == "__main__":
    main()
