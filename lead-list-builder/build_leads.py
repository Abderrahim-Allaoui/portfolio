#!/usr/bin/env python3
"""
build_leads.py
==============
Reads a CSV of companies (name + city, optionally country / industry /
website) and enriches it into a **B2B lead list** formatted for cold-outreach
tools (Instantly, Apollo, Lemlist, Snov.io).

Two modes
---------
* `--mode mock` (DEFAULT, works offline, no API key, deterministic)
    Generates realistic-but-fake decision-maker data so you can demo the
    whole workflow: contact name, job title, e-mail built from a naming
    pattern, LinkedIn URL, phone, city, country, personalisation hook.
    Every mock row is clearly flagged `enrichment_status = mock`.

* `--mode real`
    Activates the live enrichment hooks. They switch on **only** when the
    matching environment variable is set:
        HUNTER_API_KEY=...   -> Hunter.io domain search (implemented below)
        APOLLO_API_KEY=...   -> Apollo people search (stub: see `enrich_apollo`)
    Rows that fail live enrichment automatically fall back to mock data so a
    half-finished run still produces a usable file.

Usage
-----
    python build_leads.py                                   # mock, 16 demo companies
    python build_leads.py --input my_companies.csv --out-dir output
    python build_leads.py --mode real                        # needs HUNTER_API_KEY

Output columns: first_name, last_name, full_name, title, company, industry,
company_website, work_email, email_status, linkedin_url, phone, city, country,
source, enrichment_status, personalization, sequence_name, notes
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import random
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime

import pandas as pd

# ---------------------------------------------------------------------------
# Demo data pools (used in mock mode and as fallback)
# ---------------------------------------------------------------------------
FIRST_M = ["Youssef", "Mohamed", "Karim", "Rachid", "Omar", "Mehdi", "Tarik",
           "Nabil", "Hicham", "Anas", "Reda", "Ayoub", "Julien", "Thomas"]
FIRST_F = ["Khadija", "Fatima Zahra", "Samira", "Nadia", "Imane", "Salma",
           "Houda", "Ghita", "Meryem", "Amina", "Yasmine", "Manal", "Claire",
           "Sarah"]
LAST_M = ["El Amrani", "Bennani", "Alaoui", "Tazi", "Idrissi", "Chraibi",
          "Berrada", "Ouazzani", "Sekkat", "Lahlou", "Mansouri", "Tahiri",
          "Kettani", "Naciri", "Bouazza"]
LAST_F = ["Bennani", "Alaoui", "Fassi", "Idrissi", "Berrada", "Lahlou",
          "Tahiri", "Naciri", "Sabri", "Filali", "Chekrouni", "Driouech"]

TITLES = {
    "real estate": ["Head of Sales", "Agency Director", "Property Consultant",
                    "Leasing Manager", "Business Development Manager"],
    "restaurants": ["Restaurant Manager", "Owner", "Head Chef",
                    "Operations Manager", "Marketing Manager"],
    "it": ["CTO", "IT Director", "Software Engineering Manager",
           "Head of Delivery", "Sales Engineer"],
    "logistics": ["Logistics Manager", "Supply Chain Director",
                  "Fleet Manager", "Operations Director", "Key Account Manager"],
    "construction": ["Project Director", "Site Manager", "Commercial Manager",
                     "Procurement Manager", "Managing Partner"],
    "retail": ["E-commerce Manager", "Retail Director", "Brand Manager",
               "Store Manager", "Purchasing Manager"],
    "marketing": ["Managing Director", "Head of Growth", "SEO Team Lead",
                  "Account Director", "Content Strategist"],
    "tourism": ["General Manager", "Head of Reservations", "Tour Manager",
                "Revenue Manager", "Guest Relations Manager"],
    "food industry": ["Production Director", "Quality Manager",
                      "Sales Director", "Plant Manager", "Export Manager"],
}
DEFAULT_TITLES = ["General Manager", "Managing Director", "Business Owner",
                  "Head of Sales", "Marketing Manager"]

EMAIL_PATTERNS = ["{first}.{last}", "{first}", "{f}{last}", "{first}{l}",
                  "{first}_{last}"]

HOOKS = [
    "Saw {company}'s recent activity in {city} — congrats on the growth.",
    "Noticed {company} is hiring in {city}, happy to share a quick idea.",
    "{company} stands out in {city}'s market — loved the {industry} angle.",
    "Helping {industry} teams in {city} automate their busywork.",
    "Quick question about how {company} handles {industry} ops in {city}.",
]


def deterministic_rng(*parts: str) -> random.Random:
    """Same inputs -> same fake data, on every run and every machine."""
    seed = int(hashlib.md5("|".join(parts).encode("utf-8")).hexdigest()[:12], 16)
    return random.Random(seed)


def slugify(text: str) -> str:
    text = text.lower()
    text = (text.replace("è", "e").replace("é", "e").replace("ê", "e")
                .replace("à", "a").replace("ç", "c").replace("û", "u")
                .replace("î", "i").replace("ô", "o"))
    return re.sub(r"[^a-z0-9]+", "", text)


def guess_domain(company: str, website: str = "") -> str:
    """'Atlas Immobilier' + '' -> 'atlasimmobilier.ma'"""
    if website:
        site = website.strip()
        if not site.startswith("http"):
            site = "https://" + site
        return urllib.parse.urlparse(site).netloc.replace("www.", "")
    return slugify(company) + ".ma"


# ---------------------------------------------------------------------------
# MOCK enrichment (offline, deterministic, clearly flagged)
# ---------------------------------------------------------------------------
def enrich_mock(company: str, city: str, country: str, industry: str,
                website: str) -> dict:
    rng = deterministic_rng(company, city, industry)
    male = rng.random() < 0.55
    first = rng.choice(FIRST_M if male else FIRST_F)
    last = rng.choice(LAST_M if male else LAST_F)
    title = rng.choice(TITLES.get(industry.lower(), DEFAULT_TITLES))
    domain = guess_domain(company, website)

    local = rng.choice(EMAIL_PATTERNS).format(
        first=slugify(first), last=slugify(last),
        f=slugify(first)[0], l=slugify(last)[0])
    email = f"{local}@{domain}"
    slug = f"{slugify(first)}-{slugify(last)}"

    return {
        "first_name": first,
        "last_name": last,
        "full_name": f"{first} {last}",
        "title": title,
        "company_website": ("https://" + website.strip() if website and
                            not website.startswith("http") else website),
        "work_email": email,
        # a mock value: real verification needs an e-mail verifier API
        "email_status": rng.choice(["verified", "verified", "likely"]),
        "linkedin_url": f"https://www.linkedin.com/in/{slug}-{rng.randint(100000, 999999)}",
        "phone": f"+212{rng.choice('67')}{rng.randint(10000000, 99999999)}",
        "source": "mock-generator",
        "enrichment_status": "mock",
        "personalization": rng.choice(HOOKS).format(
            company=company, city=city, industry=industry),
        "sequence_name": f"{industry.title()} – {country}",
        "notes": "Demo data (mock mode). Replace with verified contacts.",
    }


# ---------------------------------------------------------------------------
# REAL enrichment hooks (activate only when the API key env var is set)
# ---------------------------------------------------------------------------
def _http_json(url: str, timeout: int = 20) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "lead-builder/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def enrich_hunter(company: str, domain: str, api_key: str) -> dict | None:
    """Hunter.io domain search -> the most complete personal contact found.

    Docs: https://api.hunter.io/v2/domain-search?domain=intercom.com&api_key=KEY
    Costs 1 credit per 10 results; check your plan before bulk runs.
    """
    url = ("https://api.hunter.io/v2/domain-search?domain="
           + urllib.parse.quote(domain) + "&limit=5&type=personal&api_key=" + api_key)
    data = _http_json(url)
    people = (data.get("data") or {}).get("emails") or []
    if not people:
        return None
    best = max(people, key=lambda p: (p.get("confidence") or 0))
    first = best.get("first_name") or ""
    last = best.get("last_name") or ""
    return {
        "first_name": first,
        "last_name": last,
        "full_name": f"{first} {last}".strip(),
        "title": best.get("position") or "",
        "work_email": best.get("value") or "",
        "email_status": ("verified" if (best.get("confidence") or 0) >= 90
                         else "likely"),
        "linkedin_url": best.get("linkedin") or "",
        "phone": best.get("phone_number") or "",
        "source": "hunter.io",
        "enrichment_status": "hunter",
        "notes": f"Hunter confidence: {best.get('confidence', 'n/a')}",
    }


def enrich_apollo(company: str, api_key: str) -> dict | None:
    """APOLLO.IO HOOK — intentionally left as a stub.

    Apollo's people-search endpoint changes shape depending on your plan and
    version, so it is not wired up blindly. To enable it:

      1. Read https://docs.apollo.io/reference/people-api-search
      2. POST https://api.apollo.io/api/v1/mixed_people/search
         headers: {"X-Api-Key": api_key, "Content-Type": "application/json"}
         body:    {"q_organization_keyword": company, "person_titles": [...] }
      3. Map the response fields into the same dictionary shape returned by
         `enrich_mock()` / `enrich_hunter()` and return it.

    Set APOLLO_API_KEY and point `--provider apollo` at this function.
    """
    raise NotImplementedError(
        "Apollo hook is a documented stub. Implement enrich_apollo() with your "
        "plan's endpoint, or use Hunter (HUNTER_API_KEY).")


# ---------------------------------------------------------------------------
# Build the list
# ---------------------------------------------------------------------------
OUT_COLUMNS = ["first_name", "last_name", "full_name", "title", "company",
               "industry", "company_website", "work_email", "email_status",
               "linkedin_url", "phone", "city", "country", "source",
               "enrichment_status", "personalization", "sequence_name", "notes"]


def load_companies(path: str) -> list[dict]:
    if not os.path.isfile(path):
        raise FileNotFoundError(path)
    rows = []
    with open(path, "r", encoding="utf-8-sig", newline="") as fh:
        for row in csv.DictReader(fh):
            company = (row.get("company") or "").strip()
            if not company:
                continue
            rows.append({
                "company": company,
                "city": (row.get("city") or "").strip(),
                "country": (row.get("country") or "Morocco").strip(),
                "industry": (row.get("industry") or "general").strip().lower(),
                "website": (row.get("website") or "").strip(),
            })
    return rows


def build(args) -> pd.DataFrame:
    hunter_key = os.environ.get("HUNTER_API_KEY", "").strip()
    apollo_key = os.environ.get("APOLLO_API_KEY", "").strip()

    if args.mode == "real" and not (hunter_key or apollo_key):
        print("WARNING: --mode real but no HUNTER_API_KEY / APOLLO_API_KEY found "
              "in the environment -> falling back to mock data.", file=sys.stderr)

    leads = []
    for item in load_companies(args.input):
        enriched: dict | None = None

        if args.mode == "real":
            try:
                if args.provider == "apollo":
                    if apollo_key:
                        enriched = enrich_apollo(item["company"], apollo_key)
                elif hunter_key:
                    enriched = enrich_hunter(item["company"],
                                             guess_domain(item["company"], item["website"]),
                                             hunter_key)
            except NotImplementedError as exc:
                print(f"  ! {exc}", file=sys.stderr)
            except (urllib.error.URLError, urllib.error.HTTPError,
                    TimeoutError, json.JSONDecodeError) as exc:
                print(f"  ! live enrichment failed for {item['company']}: {exc}",
                      file=sys.stderr)
            except Exception as exc:                    # never lose the whole run
                print(f"  ! unexpected error for {item['company']}: "
                      f"{type(exc).__name__}: {exc}", file=sys.stderr)

        row = enrich_mock(item["company"], item["city"], item["country"],
                          item["industry"], item["website"])
        if enriched:                                    # overlay the real data
            row.update({k: v for k, v in enriched.items() if v})
            row["notes"] = enriched.get("notes", row["notes"])
        elif args.mode == "real":
            row["enrichment_status"] = "live_failed_mock_fallback"
            row["notes"] = "Live API returned nothing -> mock data. Verify before use."

        row.update({"company": item["company"], "city": item["city"],
                    "country": item["country"], "industry": item["industry"]})
        if not row.get("company_website"):
            row["company_website"] = ("https://" + item["website"]
                                      if item["website"] else "")
        leads.append(row)

    df = pd.DataFrame(leads)
    # de-duplicate on e-mail so the same person never gets two emails
    df = df.drop_duplicates(subset=["work_email"]).reset_index(drop=True)
    return df[OUT_COLUMNS]


def export(df: pd.DataFrame, out_dir: str) -> list[str]:
    from copy import copy

    os.makedirs(out_dir, exist_ok=True)
    xlsx = os.path.join(out_dir, "lead_list.xlsx")
    csv_path = os.path.join(out_dir, "lead_list.csv")

    summary = pd.DataFrame([
        ("Total leads", len(df)),
        ("Distinct companies", df["company"].nunique()),
        ("Enriched via live API", int((~df["enrichment_status"].str
                                       .contains("mock")).sum())),
        ("Mock / demo rows", int(df["enrichment_status"].str.contains("mock").sum())),
        ("Emails marked verified", int((df["email_status"] == "verified").sum())),
        ("Countries", ", ".join(sorted(df["country"].unique()))),
        ("Generated", datetime.now().strftime("%Y-%m-%d %H:%M")),
    ], columns=["Metric", "Value"])

    with pd.ExcelWriter(xlsx, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="leads")
        summary.to_excel(writer, index=False, sheet_name="summary", startrow=1)
        for sheet in (writer.sheets["leads"], writer.sheets["summary"]):
            for cell in sheet[1]:
                if cell.value:
                    f = copy(cell.font)
                    f.bold = True
                    cell.font = f
            sheet.freeze_panes = "A2"
            for col_cells in sheet.columns:
                width = max((len(str(c.value)) for c in col_cells
                             if c.value is not None), default=10)
                sheet.column_dimensions[col_cells[0].column_letter].width = \
                    min(width + 2, 42)
        ws = writer.sheets["leads"]
        ws.auto_filter.ref = ws.dimensions
        for row in ws.iter_rows(min_row=2):            # keep phone as text
            row[OUT_COLUMNS.index("phone")].number_format = "@"

    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    return [xlsx, csv_path]


def main() -> int:
    ap = argparse.ArgumentParser(description="Build an enriched B2B lead list.")
    ap.add_argument("--input", default="input_companies.csv",
                    help="CSV with: company, city, country, industry, website")
    ap.add_argument("--out-dir", default="demo_output", help="Output folder")
    ap.add_argument("--mode", choices=("mock", "real"), default="mock",
                    help="mock = offline demo (default); real = use API keys")
    ap.add_argument("--provider", choices=("hunter", "apollo"), default="hunter",
                    help="Which live provider to call in --mode real")
    args = ap.parse_args()

    try:
        df = build(args)
    except FileNotFoundError:
        print(f"ERROR: input file not found: {args.input}", file=sys.stderr)
        return 1

    paths = export(df, args.out_dir)
    print(f"Leads   : {len(df)} ({df['company'].nunique()} companies)")
    print(f"Mode    : {args.mode}"
          + (f" / provider={args.provider}" if args.mode == "real" else
             " (fake data, clearly flagged in `enrichment_status`)"))
    for p in paths:
        print(f"Output  : {p}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
