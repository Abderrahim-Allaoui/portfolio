#!/usr/bin/env python3
"""
clean_data.py
=============
Turns a messy contact export (Excel or CSV) into a clean, analysis-ready file.

Pipeline (each step reports what it changed):

  1. Text hygiene      – trim, collapse spaces, kill non-breaking / zero-width chars
  2. Encoding repair   – fix the classic "UTF-8 read as Latin-1" mojibake
  3. Company names     – consistent case, accents kept, legal suffixes standardised
  4. E-mails           – lowercase, strip mailto:/spaces, repair [at] / (dot)
  5. Phone numbers     – Moroccan formats -> E.164 (+212...)
  6. Dates             – 10+ formats  -> ISO 2024-03-12
  7. Cities            – consistent spelling / casing
  8. De-duplication    – exact (e-mail, phone) + fuzzy (company + contact name)
  9. Export            – cleaned_output.xlsx + changes_report.md

Usage
-----
    python generate_messy.py          # creates messy_sample.xlsx  (demo input)
    python clean_data.py              # cleans it into demo_output/
    python clean_data.py --input my_file.csv --sheet 0

Runs offline. `rapidfuzz` is used for fuzzy matching when installed, otherwise
it falls back to the Python standard library (slightly less accurate).
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import unicodedata
from datetime import datetime

import pandas as pd

try:                                   # faster + more accurate fuzzy matching
    from rapidfuzz import fuzz

    def similarity(a: str, b: str) -> float:
        return float(fuzz.token_set_ratio(a or "", b or ""))
except ImportError:                    # standard-library fallback
    from difflib import SequenceMatcher

    def similarity(a: str, b: str) -> float:
        return SequenceMatcher(None, (a or "").lower(), (b or "").lower()).ratio() * 100

FUZZY_THRESHOLD = 85                   # >= this and the two rows are "the same person"
NEAR_MISS = 70                         # reported as "worth reviewing", but kept

COLUMNS = ["Contact Name", "Company", "Email", "Phone", "Signup Date", "City", "Source"]

# Legal suffixes that should never be part of the identity of a company
LEGAL_SUFFIXES = {"sarl", "sa", "s.a.", "s as", "sas", "eurl", "snc", "sarlau",
                  "ltd", "limited", "llc", "gmbh", "inc", "corp", "co"}
CANONICAL_SUFFIX = {"sarl": "SARL", "sa": "SA", "s.a.": "SA", "s as": "SA",
                    "sas": "SAS", "eurl": "EURL", "snc": "SNC", "sarlau": "SARLAU",
                    "ltd": "LTD", "limited": "LTD", "llc": "LLC", "gmbh": "GMBH",
                    "inc": "INC", "corp": "CORP", "co": "CO"}

CITY_ALIASES = {"casa": "Casablanca", "casa blanca": "Casablanca",
                "casablanca": "Casablanca", "marrakesh": "Marrakech",
                "marrakech": "Marrakech", "rabat": "Rabat", "tanger": "Tanger",
                "tangier": "Tanger", "fes": "Fès", "fès": "Fès",
                "meknes": "Meknès", "meknès": "Meknès", "agadir": "Agadir",
                "oujda": "Oujda", "kenitra": "Kénitra", "kénitra": "Kénitra",
                "salé": "Salé", "sale": "Salé"}

MONTHS_FR = {"janv": 1, "févr": 2, "fevr": 2, "mars": 3, "avr": 4, "mai": 5,
             "juin": 6, "juil": 7, "août": 8, "aout": 8, "sept": 9, "oct": 10,
             "nov": 11, "déc": 12, "dec": 12}
MONTHS_EN = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
             "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}

MISSING_TOKENS = {"", "-", "n/a", "na", "none", "null", "nan", "?"}


class Stats:
    """Tiny counter bag + example collector used by every cleaning step."""

    def __init__(self) -> None:
        self.counts: dict[str, int] = {}
        self.examples: dict[str, list[str]] = {}

    def add(self, key: str, before: str = "", after: str = "") -> None:
        self.counts[key] = self.counts.get(key, 0) + 1
        if before or after:
            self.examples.setdefault(key, [])
            if len(self.examples[key]) < 5:
                self.examples[key].append(f"`{before}` → `{after}`")

    @property
    def total(self) -> int:
        return sum(self.counts.values())


# ---------------------------------------------------------------------------
# 1-2. Text hygiene + encoding repair
# ---------------------------------------------------------------------------
def clean_text(value) -> str:
    """Normalize whitespace and remove invisible characters."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    s = str(value)
    s = s.replace("\u00a0", " ")         # non-breaking space
    s = s.replace("\u200b", "")          # zero-width space
    s = s.replace("\ufeff", "")          # BOM inside a cell
    s = s.replace("\r", " ").replace("\n", " ")
    return re.sub(r"\s+", " ", s).strip()


def fix_mojibake(text: str) -> str:
    """Repair 'RÃ©sidence' -> 'Résidence' (UTF-8 bytes decoded as Latin-1)."""
    if "Ã" not in text and "â€" not in text:
        return text
    try:
        repaired = text.encode("latin-1").decode("utf-8")
        # Only accept the repair if it actually looks better
        if repaired and not re.search(r"Ã|â€", repaired):
            return repaired
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass
    return text


# ---------------------------------------------------------------------------
# 3. Company names
# ---------------------------------------------------------------------------
def standardize_company(raw: str) -> str:
    """'  MAROC DIGITAL agency sarl ' -> 'Maroc Digital Agency SARL'."""
    s = clean_text(raw).strip(" ,.;")
    if not s:
        return ""
    tokens = []
    for tok in s.split():
        key = tok.lower().strip(".")            # "S.a." / "sarl," -> "s a" / "sarl"
        key = key.replace(".", "")              # "s.a" -> "sa"
        if key in LEGAL_SUFFIXES:
            tokens.append(CANONICAL_SUFFIX[key])
        else:
            tokens.append(tok.capitalize() if tok.isupper() or tok.islower() else tok)
    out = " ".join(tokens)
    return re.sub(r"\s+", " ", out).strip()


def company_key(raw: str) -> str:
    """Accent-free, suffix-free key used to group company duplicates."""
    s = clean_text(raw).lower()
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    words = []
    for w in s.split():
        w = w.strip(".,;()").replace(".", "")     # "s.a." -> "sa"
        if not w or w in LEGAL_SUFFIXES:
            continue
        words.append(w)
    return "".join(words)


# ---------------------------------------------------------------------------
# 4. E-mails
# ---------------------------------------------------------------------------
def normalize_email(raw: str, stats: Stats) -> str:
    s = clean_text(raw)
    if s.lower() in MISSING_TOKENS:
        return ""
    before = s
    s = s.lower().replace("mailto:", "").replace(" ", "").replace("\u00a0", "")
    s = s.replace("[at]", "@").replace("(at)", "@").replace(" at ", "@")
    s = s.replace("[dot]", ".").replace("(dot)", ".").replace(" dot ", ".")
    s = s.replace("@@", "@")
    s = s.strip(".,;")
    # Fix "local@domaincm" -> missing dot before the TLD is too risky; only fix
    # the very common trailing-dot and space-around-@ mistakes.
    if not re.fullmatch(r"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$", s):
        stats.add("email_invalid", before, "")
        return ""
    if s != before:
        stats.add("email_fixed", before, s)
    return s


# ---------------------------------------------------------------------------
# 5. Phones (Morocco: mobile 06xx/07xx, landline 05xx)
# ---------------------------------------------------------------------------
def normalize_phone(raw: str, stats: Stats) -> str:
    s = clean_text(raw)
    if s.lower() in MISSING_TOKENS:
        return ""
    before = s
    digits = re.sub(r"\D", "", s)
    if digits.startswith("00212"):
        digits = digits[5:]
    elif digits.startswith("212"):
        digits = digits[3:]
    if digits.startswith("0"):
        digits = digits[1:]
    if len(digits) == 9 and digits[0] in "567":
        out = "+212" + digits
        if out != before:
            stats.add("phone_normalized", before, out)
        return out
    stats.add("phone_invalid", before, "")
    return ""


# ---------------------------------------------------------------------------
# 6. Dates
# ---------------------------------------------------------------------------
def parse_date(raw: str, stats: Stats):
    """Return an ISO 'YYYY-MM-DD' string (or '' when unparseable)."""
    s = clean_text(raw)
    if s.lower() in MISSING_TOKENS:
        return ""
    before = s

    # "2024-03-12 00:00:00" (Excel date cell read as text)
    m = re.match(r"^(\d{4}-\d{2}-\d{2})", s)
    if m:
        try:
            datetime.strptime(m.group(1), "%Y-%m-%d")
            stats.add("date_fixed", before, m.group(1))
            return m.group(1)
        except ValueError:
            pass

    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%Y", "%d/%m/%y",
                "%d-%b-%y", "%d-%b-%Y", "%b %d, %Y", "%d %B %Y", "%Y/%m/%d",
                "%d %b %Y", "%B %d, %Y"):
        try:
            out = datetime.strptime(s, fmt).strftime("%Y-%m-%d")
            stats.add("date_fixed", before, out)
            return out
        except ValueError:
            continue

    # French month names ("12 mars 2024")
    m = re.match(r"^(\d{1,2})\s+([a-zéûô]+)\.?\s+(\d{4})$", s.lower())
    if m and m.group(2) in MONTHS_FR:
        try:
            dt = datetime(int(m.group(3)), MONTHS_FR[m.group(2)], int(m.group(1)))
            stats.add("date_fixed", before, dt.strftime("%Y-%m-%d"))
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            pass

    stats.add("date_failed", before, "")
    return ""


# ---------------------------------------------------------------------------
# 7. Cities
# ---------------------------------------------------------------------------
def normalize_city(raw: str) -> str:
    s = clean_text(raw)
    if not s:
        return ""
    alias = CITY_ALIASES.get(s.lower())
    if alias:
        return alias
    return s.title()


# ---------------------------------------------------------------------------
# 8. De-duplication
# ---------------------------------------------------------------------------
def deduplicate(df: pd.DataFrame, stats: Stats) -> pd.DataFrame:
    """Exact (e-mail / phone) + fuzzy (company + contact name) de-duplication."""
    df = df.copy()
    df["_score"] = df.apply(lambda r: sum(bool(clean_text(v)) for v in r[COLUMNS]), axis=1)

    drop: set[int] = set()

    def drop_pair(i_keep, i_drop, reason, label):
        if i_drop in drop or i_keep in drop:
            return                              # never count a row twice
        drop.add(i_drop)
        stats.add(reason)
        stats.examples.setdefault(reason, [])
        if len(stats.examples[reason]) < 8:
            a, b = df.at[i_keep, "Contact Name"], df.at[i_drop, "Contact Name"]
            ca, cb = df.at[i_keep, "Company"], df.at[i_drop, "Company"]
            stats.examples[reason].append(f"kept **{a}** ({ca}) / removed **{b}** ({cb}) — {label}")

    # -- exact duplicates: same e-mail or same phone -------------------------
    for col in ("Email", "Phone"):
        seen: dict[str, int] = {}
        for i in df.index:
            val = df.at[i, col]
            if not val:
                continue
            if val in seen:
                keeper = seen[val]
                if i in drop:                       # already dropped elsewhere
                    continue
                # keep the more complete row
                if df.at[i, "_score"] > df.at[keeper, "_score"]:
                    drop_pair(keeper, i, f"dup_exact_{col.lower()}",
                              f"same {col.lower()} `{val}`")
                    seen[val] = i
                else:
                    drop_pair(i, keeper, f"dup_exact_{col.lower()}",
                              f"same {col.lower()} `{val}`")
            else:
                seen[val] = i

    # -- fuzzy duplicates: same company, similar contact name ----------------
    near_misses: list[str] = []
    groups: dict[str, list[int]] = {}
    for i in df.index:
        key = company_key(df.at[i, "Company"])
        if not key:
            continue                                # no company: can't group safely
        groups.setdefault(key, []).append(i)

    for key, idxs in groups.items():
        if len(idxs) < 2:
            continue
        kept = [i for i in idxs if i not in drop]
        for i in idxs:
            if i in drop:
                continue
            for j in kept:
                if j >= i or j in drop:
                    continue
                score = similarity(df.at[i, "Contact Name"], df.at[j, "Contact Name"])
                if score >= FUZZY_THRESHOLD:
                    keeper, loser = (i, j) if df.at[i, "_score"] >= df.at[j, "_score"] else (j, i)
                    drop_pair(keeper, loser, "dup_fuzzy",
                              f"name similarity {score:.0f}%")
                elif score >= NEAR_MISS:
                    near_misses.append(
                        f"`{df.at[i, 'Contact Name']}` vs `{df.at[j, 'Contact Name']}` "
                        f"({df.at[i, 'Company']}) — {score:.0f}%")

    stats.counts["near_miss_kept"] = len(near_misses)
    if near_misses:
        stats.examples["near_miss_kept"] = near_misses[:8]

    out = df.drop(index=list(drop)).drop(columns=["_score"]).reset_index(drop=True)
    stats.counts["duplicates_removed"] = len(drop)
    return out


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------
def load_input(path: str, sheet) -> pd.DataFrame:
    if path.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(path, sheet_name=sheet, dtype=str)
    else:
        # latin-1 is a safe bet for messy CSV exports from old systems
        for enc in ("utf-8-sig", "latin-1"):
            try:
                df = pd.read_csv(path, dtype=str, encoding=enc)
                break
            except UnicodeDecodeError:
                continue
    df.columns = [clean_text(c) for c in df.columns]
    for col in COLUMNS:
        if col not in df.columns:
            df[col] = ""
    return df[COLUMNS].fillna("")


def clean(df: pd.DataFrame) -> tuple[pd.DataFrame, Stats]:
    stats = Stats()
    rows = []
    for _, r in df.iterrows():
        raw_company = clean_text(r["Company"])
        rows.append({
            "Contact Name": clean_text(r["Contact Name"]),
            "Company": standardize_company(fix_mojibake(raw_company)),
            "Email": normalize_email(fix_mojibake(clean_text(r["Email"])), stats),
            "Phone": normalize_phone(clean_text(r["Phone"]), stats),
            "Signup Date": parse_date(clean_text(r["Signup Date"]), stats),
            "City": normalize_city(fix_mojibake(clean_text(r["City"]))),
            "Source": clean_text(r["Source"]).title(),
        })
    out = pd.DataFrame(rows, columns=COLUMNS)

    # count repairs that belong to no specific step above
    for col in ("Contact Name", "Company", "City", "Source"):
        for i in df.index:
            before = str(df.at[i, col] or "")
            if "Ã" in before or "â€" in before:
                stats.add("encoding_fixed", before, out.at[i, col])
    for i in df.index:
        before = str(df.at[i, "Contact Name"] or "")
        if before != out.at[i, "Contact Name"]:
            stats.add("text_hygiene", before, out.at[i, "Contact Name"])
        raw_company = clean_text(df.at[i, "Company"])
        if standardize_company(fix_mojibake(raw_company)) != raw_company:
            stats.add("company_fixed", raw_company,
                      standardize_company(fix_mojibake(raw_company)))

    out = deduplicate(out, stats)
    return out, stats


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------
def export_excel(df: pd.DataFrame, path: str, stats: Stats, input_name: str) -> None:
    from copy import copy

    summary = pd.DataFrame(
        [("Rows in (dirty)", stats.counts.get("rows_in", "")),
         ("Rows out (clean)", len(df)),
         ("Duplicates removed (total)", stats.counts.get("duplicates_removed", 0)),
         ("  · exact e-mail/phone",
          stats.counts.get("dup_exact_email", 0) + stats.counts.get("dup_exact_phone", 0)),
         ("  · fuzzy (name + company)", stats.counts.get("dup_fuzzy", 0)),
         ("Near-duplicates kept for review", stats.counts.get("near_miss_kept", 0)),
         ("E-mails repaired", stats.counts.get("email_fixed", 0)),
         ("E-mails invalid (emptied)", stats.counts.get("email_invalid", 0)),
         ("Phones normalized to +212", stats.counts.get("phone_normalized", 0)),
         ("Phones invalid (emptied)", stats.counts.get("phone_invalid", 0)),
         ("Dates parsed", stats.counts.get("date_fixed", 0)),
         ("Dates unparsed (emptied)", stats.counts.get("date_failed", 0)),
         ("Broken encodings repaired", stats.counts.get("encoding_fixed", 0)),
         ("Generated", datetime.now().strftime("%Y-%m-%d %H:%M")),
         ("Source file", input_name)],
        columns=["Metric", "Value"])

    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="cleaned")
        summary.to_excel(writer, index=False, sheet_name="summary", startrow=1)
        for ws in (writer.sheets["cleaned"], writer.sheets["summary"]):
            for cell in ws[1]:
                if cell.value:
                    f = copy(cell.font)
                    f.bold = True
                    cell.font = f
            ws.freeze_panes = "A2"
            if ws.title == "cleaned":
                ws.auto_filter.ref = ws.dimensions
                # force Phone / Signup Date to display as text so Excel (and
                # downstream tools) never turn "+212..." into a number
                for row in ws.iter_rows(min_row=2):
                    for idx in (3, 4):
                        row[idx].number_format = "@"
            for col_cells in ws.columns:
                width = max((len(str(c.value)) for c in col_cells if c.value is not None),
                            default=10)
                ws.column_dimensions[col_cells[0].column_letter].width = min(width + 2, 45)


def write_report(path: str, stats: Stats, rows_in: int, rows_out: int,
                 input_name: str, output_name: str) -> None:
    c = stats.counts

    def bullets(key: str) -> str:
        ex = stats.examples.get(key, [])
        if not ex:
            return "  _none needed_"
        return "\n".join(f"  - {e}" for e in ex)

    md = f"""# Data cleaning report

**Input:** `{input_name}` — {rows_in} rows
**Output:** `{output_name}` — {rows_out} rows
**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')} · offline, reproducible

## Summary

| Metric | Value |
|---|---:|
| Rows in | {rows_in} |
| Rows out | {rows_out} |
| Duplicates removed | **{c.get('duplicates_removed', 0)}** |
| ↳ exact (same e-mail or phone) | {c.get('dup_exact_email', 0) + c.get('dup_exact_phone', 0)} |
| ↳ fuzzy (same company + similar name) | {c.get('dup_fuzzy', 0)} |
| Near-duplicates kept for human review | {c.get('near_miss_kept', 0)} |
| E-mails repaired | {c.get('email_fixed', 0)} |
| E-mails invalid → emptied | {c.get('email_invalid', 0)} |
| Phone numbers normalized to `+212…` | {c.get('phone_normalized', 0)} |
| Phone numbers invalid → emptied | {c.get('phone_invalid', 0)} |
| Dates parsed to ISO `YYYY-MM-DD` | {c.get('date_fixed', 0)} |
| Dates unparseable → emptied | {c.get('date_failed', 0)} |
| Broken encodings repaired | {c.get('encoding_fixed', 0)} |
| Company names standardized | {c.get('company_fixed', 0)} |

## What was fixed

### Duplicate contacts removed
{bullets('dup_fuzzy')}

### E-mails repaired (lowercased, `[at]`/`[dot]`, `mailto:`, stray spaces)
{bullets('email_fixed')}

### E-mails that could not be repaired (emptied, flagged for the client)
{bullets('email_invalid')}

### Phone numbers (all Moroccan formats → E.164)
{bullets('phone_normalized')}

### Dates (many formats → ISO 8601)
{bullets('date_fixed')}

### Broken encodings (`RÃ©sidence` → `Résidence`)
{bullets('encoding_fixed')}

## Assumptions & limits

- Dates are interpreted **day-first** (`12/03/2024` = 12 March 2024), the
  French/Moroccan convention. Ambiguous dates should be confirmed with the client.
- Fuzzy matching threshold: **{FUZZY_THRESHOLD}%** similarity on the contact name,
  within the same standardised company. Pairs between {NEAR_MISS}% and {FUZZY_THRESHOLD}% are
  listed above as "kept for review" instead of being merged automatically.
- Unparseable e-mails/phones are **emptied, not guessed** — silently inventing
  contact data is worse than leaving a blank.
- Nothing was deleted from the source file; the cleaned file is a new sheet.
"""
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(md)


def main() -> int:
    ap = argparse.ArgumentParser(description="Clean a messy Excel/CSV contact export.")
    ap.add_argument("--input", default="messy_sample.xlsx", help="Dirty file (.xlsx or .csv)")
    ap.add_argument("--sheet", default=0, help="Sheet name or index (default 0)")
    ap.add_argument("--out-dir", default="demo_output", help="Output folder")
    ap.add_argument("--name", default="cleaned_output", help="Output file base name")
    args = ap.parse_args()

    if not os.path.isfile(args.input):
        print(f"ERROR: input file not found: {args.input}\n"
              f"       Generate the demo input first:  python generate_messy.py",
              file=sys.stderr)
        return 1

    sheet = int(args.sheet) if str(args.sheet).isdigit() else args.sheet
    try:
        df = load_input(args.input, sheet)
    except Exception as exc:
        print(f"ERROR: could not read {args.input}: {type(exc).__name__}: {exc}",
              file=sys.stderr)
        return 1

    cleaned, stats = clean(df)
    stats.counts["rows_in"] = len(df)

    os.makedirs(args.out_dir, exist_ok=True)
    xlsx_path = os.path.join(args.out_dir, f"{args.name}.xlsx")
    md_path = os.path.join(args.out_dir, f"changes_report.md")
    export_excel(cleaned, xlsx_path, stats, os.path.basename(args.input))
    write_report(md_path, stats, len(df), len(cleaned),
                 os.path.basename(args.input), os.path.basename(xlsx_path))

    print(f"Rows in : {len(df)}")
    print(f"Rows out: {len(cleaned)}  "
          f"({stats.counts.get('duplicates_removed', 0)} duplicates removed, "
          f"{stats.counts.get('near_miss_kept', 0)} kept for review)")
    print(f"XLSX    : {xlsx_path}")
    print(f"Report  : {md_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
