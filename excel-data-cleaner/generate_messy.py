#!/usr/bin/env python3
"""
generate_messy.py
=================
Creates `messy_sample.xlsx` — a realistic "client-style" contact export with
~200 rows of the problems real datasets actually have:

  * duplicate contacts (same person, different spelling / punctuation)
  * company names in random case, with and without accents (SARL / S.A. / ltd)
  * broken encodings ("RÃ©sidence Al Qods" = UTF-8 read as Latin-1)
  * e-mails with spaces, [at] / (dot) obfuscation, mailto: prefixes, upper case
  * phone numbers in 6 different formats (+212, 00212, 06XX, 06 XX XX XX XX ...)
  * dates in 8 different formats (12/03/2024, 2024-03-12, 12-Mar-24, ...)
  * missing values ("", "N/A", "-")

The output is deterministic (seed = 42): running it twice gives the same file.

Run:  python generate_messy.py
"""

from __future__ import annotations

import random
import re
import unicodedata
from datetime import datetime, timedelta

import pandas as pd

SEED = 42
OUT_FILE = "messy_sample.xlsx"
N_BASE_ROWS = 140      # unique-ish contacts
N_DUPLICATE_ROWS = 60  # dirty copies of some of the above

random.seed(SEED)

# ---------------------------------------------------------------------------
# Raw material (fictional Moroccan / French business data)
# ---------------------------------------------------------------------------
FIRST = ["Youssef", "Khadija", "Mohamed", "Fatima Zahra", "Rachid", "Samira",
         "Karim", "Nadia", "Hamid", "Leila", "Omar", "Imane", "Tarik", "Salma",
         "Mehdi", "Houda", "Nabil", "Ghita", "Ayoub", "Meryem", "Julien",
         "Claire", "Sami", "Amina", "Zakaria", "Souad", "Reda", "Yasmine",
         "Anas", "Manal", "Elodie", "Thomas", "Sarah", "Hicham", "Btissam"]

LAST = ["El Amrani", "Bennani", "Alaoui", "Tazi", "Fassi", "Idrissi", "Chraibi",
        "Berrada", "Ouazzani", "Sekkat", "Lahlou", "Mansouri", "Benjelloun",
        "Tahiri", "Kettani", "Naciri", "Bouazza", "Sabri", "Zerhouni",
        "Mrabet", "Lamrani", "Filali", "Boukhris", "Chekrouni", "Driouech"]

COMPANIES = [
    "Atlas Immobilier", "Casa Tech Solutions", "Maroc Digital Agency",
    "Groupe Al Massira", "Riad Consulting", "Sahara Construction",
    "Nord Ouest Logistique", "Bergerie Numérique", "Détroit Import Export",
    "Essaouira Voyages", "Fès Poterie Tradition", "Meknès Agro",
    "Oujda Plastic", "Kénitra Pharma", "Tanger Med Freight",
    "Agadir Peche Marine", "Rabat Legal Partners", "Médina Artisanat",
    "Guéliz Properties", "Zellige Design Studio", "Amber Coast Rentals",
    "Beldi Food Company", "Cèdre Informatique", "Dune Media",
    "Énergie Atlas", "Fennec Softworks", "Gharb Mills", "Hassan Telecom",
    "Iris Cosmetics", "Jardin des Orangers", "Kenzi Facilities",
    "Lion Berbere Media", "Meridian Consulting", "Nador Fish Export",
    "Oasis Irrigation", "Palmeraie Events", "Quartz Mining",
    "Rif Timber Group", "Souss Agro Export", "Toubkal Outdoor",
    "Union Textile", "Villa Blanca Interiors", "Wahda Distrib",
    "Yasmine Beauty Club", "Zenata Developpement", "Al Qods Résidence",
    "Ets. Benali", "Frères Naciri", "Société Chraibi", "Maison Tazi",
]

CITIES = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fès",
          "Meknès", "Oujda", "Kénitra"]
SOURCES = ["Web", "facebook ads", "Salon Casablanca", "Referral", "cold call",
           "linkedin", "FACEBOOK ADS", "Salon Casablanca"]

MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
             "Sep", "Oct", "Nov", "Dec"]
MONTHS_FR = ["janv", "févr", "mars", "avr", "mai", "juin", "juil",
             "août", "sept", "oct", "nov", "déc"]


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------
def ascii_slug(text: str) -> str:
    """'Élodie Benjelloun' -> 'elodie.benjelloun'"""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", ".", text.lower()).strip(".")


def company_domain(company: str) -> str:
    slug = ascii_slug(company).replace(".", "")
    slug = re.sub(r"(sarl|sa|ltd|llc|sas|eurl)$", "", slug)
    return f"{slug}.ma"


def strip_accents(text: str) -> str:
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()


def mojibake(text: str) -> str:
    """Simulate the classic 'UTF-8 bytes re-read as Latin-1' corruption.

    'Résidence'.encode('utf-8').decode('latin-1')  ->  'RÃ©sidence'
    """
    try:
        return text.encode("utf-8").decode("latin-1")
    except Exception:
        return text


def random_date() -> datetime:
    start = datetime(2022, 1, 1)
    return start + timedelta(days=random.randint(0, 1150))


def date_variant(dt: datetime) -> object:
    """Return the same date written in one of 8 messy formats."""
    choice = random.random()
    if choice < 0.28:
        return dt.strftime("%d/%m/%Y")          # 12/03/2024  (French / day-first)
    if choice < 0.45:
        return dt.strftime("%Y-%m-%d")          # 2024-03-12
    if choice < 0.58:
        return dt.strftime("%d-%m-%Y")          # 12-03-2024
    if choice < 0.68:
        return dt.strftime("%d.%m.%Y")          # 12.03.2024
    if choice < 0.78:
        return dt.strftime("%d-%b-%y")          # 12-Mar-24
    if choice < 0.86:
        return dt.strftime("%b %d, %Y")         # Mar 12, 2024
    if choice < 0.93:
        return dt.strftime("%d %B %Y")          # 12 March 2024
    return dt                                   # a real Excel date-time cell


def phone_variant(mobile: bool = True) -> str:
    """A Moroccan number (mobile 06xx / landline 05xx) in a random format."""
    if mobile:
        core = "6" + str(random.randint(10_000_000, 99_999_999))   # 06 + 8 digits
    else:
        core = "522" + str(random.randint(100_000, 999_999))       # 0522 + 6 digits
    p = random.random()
    if p < 0.18:
        return f"+212 {core[0]} {core[1:3]} {core[3:5]} {core[5:7]} {core[7:9]}"
    if p < 0.32:
        return f"00212{core}"
    if p < 0.48:
        return f"0{core[0]} {core[1:3]} {core[3:5]} {core[5:7]} {core[7:9]}"
    if p < 0.60:
        return f"0{core[0]}{core[1:3]}-{core[3:5]}-{core[5:7]}-{core[7:9]}"
    if p < 0.74:
        return f"+212{core}"
    if p < 0.86:
        return f"212 {core}"
    return f"0{core}"


def email_variant(addr: str) -> str:
    """Same e-mail address, dirtied in a realistic way."""
    p = random.random()
    if p < 0.18:
        return addr.upper()
    if p < 0.32:
        return f"  {addr}  "
    if p < 0.44:
        return addr.replace("@", "[at]")
    if p < 0.54:
        return addr.replace("@", " (at) ").replace(".", " [dot] ", 1)
    if p < 0.62:
        return f"mailto:{addr}"
    if p < 0.72:
        local, domain = addr.split("@")
        return f"{local} @{domain}"
    if p < 0.80:
        local, domain = addr.split("@")
        return f"{local.replace('.', ' ')} @{domain.upper()}"
    if p < 0.86:
        return f"{addr}."                     # trailing dot typo
    if p < 0.92:
        return f"{addr[:-3]}cm"               # ".ma" -> "cm" typo (irreparable)
    return addr                               # clean


def city_variant(city: str) -> str:
    """Same city, different casing / abbreviation."""
    p = random.random()
    if p < 0.35:
        return city.upper()
    if p < 0.65:
        return city.lower()
    if p < 0.80:
        return f" {city} "
    return city


def company_variant(name: str) -> str:
    """Same company, different casing / accents / legal suffix."""
    suffix = random.choice(["", "", "", " SARL", " S.A.", " ltd", " SAS", " sa"])
    p = random.random()
    if p < 0.20:
        out = name.upper()
    elif p < 0.35:
        out = name.lower()
    elif p < 0.50:
        out = strip_accents(name)             # accents removed
    elif p < 0.58:
        out = mojibake(name)                  # broken encoding
    elif p < 0.66:
        out = f"  {name} "                    # stray spaces
    elif p < 0.72:
        out = name.replace(" ", "  ")         # double spaces
    else:
        out = name
    out = out + suffix
    if random.random() < 0.12:
        out = out.replace(" ", "\u00a0", 1)   # non-breaking space
    return out


def name_variant(full_name: str) -> str:
    """Same person, slightly different spelling (what makes de-duplication hard)."""
    replacements = {
        "Youssef": "Yousef", "Khadija": "Khadidja", "Fatima Zahra": "Fatima-Zahra",
        "El Amrani": "Amrani", "Elodie": "Élodie", "Sarah": "Sara", "Imane": "Imen",
        "Mohamed": "Mohamed ", "Ghita": "Ghita", "Ayoub": "Ayoub",
    }
    for original, tweaked in replacements.items():
        if original in full_name:
            return full_name.replace(original, tweaked, 1)
    # No known tweak -> just add stray whitespace
    return random.choice([full_name + " ", " " + full_name])


# ---------------------------------------------------------------------------
# Build the dataset
# ---------------------------------------------------------------------------
def build_rows() -> list[dict]:
    rows: list[dict] = []
    base_rows: list[dict] = []

    for i in range(N_BASE_ROWS):
        first = random.choice(FIRST)
        last = random.choice(LAST)
        name = f"{first} {last}"
        company = random.choice(COMPANIES)
        domain = company_domain(company)

        email = email_variant(f"{ascii_slug(name)}@{domain}")
        phone = phone_variant(mobile=random.random() < 0.8)
        date = date_variant(random_date())
        city = random.choice(CITIES)
        if random.random() < 0.25:
            city = city.upper() if random.random() < 0.5 else city.lower()
        source = random.choice(SOURCES)

        # ~5% of rows have a hole in them, like real client data
        if random.random() < 0.05:
            email = random.choice(["", "N/A", "-"])
        if random.random() < 0.04:
            phone = random.choice(["", "N/A"])
        if random.random() < 0.04:
            date = random.choice(["", "-"])
        if random.random() < 0.03:
            company = random.choice(["", "N/A"])
        if random.random() < 0.03:
            city = random.choice(["casablanca ", "CASA", "Casablanca"])

        # ~10% of rows carry the classic broken-encoding artefact ("RÃ©sidence")
        company_in_file = mojibake(company) if random.random() < 0.12 else company
        city_in_file = mojibake(city) if random.random() < 0.06 else city

        row = {"Contact Name": name, "Company": company_in_file, "Email": email,
               "Phone": phone, "Signup Date": date, "City": city_in_file,
               "Source": source}
        rows.append(row)
        base_rows.append({"name": name, "company": company, "domain": domain,
                          "city": city})

    # --- inject dirty copies of existing contacts ---------------------------
    for i in range(N_DUPLICATE_ROWS):
        src = base_rows[i % len(base_rows)] if i < 30 else random.choice(base_rows)
        row = {
            "Contact Name": name_variant(src["name"]),
            "Company": company_variant(src["company"]),
            "Email": email_variant(f"{ascii_slug(src['name'])}@{src['domain']}"),
            "Phone": phone_variant(mobile=random.random() < 0.8),
            "Signup Date": date_variant(random_date()),
            "City": city_variant(src["city"]),
            "Source": random.choice(SOURCES),
        }
        rows.append(row)

    # keep a stable-ish shuffle so the file looks like a real export
    random.shuffle(rows)
    return rows


def main() -> int:
    rows = build_rows()
    df = pd.DataFrame(rows, columns=["Contact Name", "Company", "Email", "Phone",
                                     "Signup Date", "City", "Source"])
    df.to_excel(OUT_FILE, index=False, sheet_name="raw_export")
    print(f"Wrote {OUT_FILE}: {len(df)} rows, "
          f"{df['Contact Name'].nunique()} distinct contact names.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
