# Excel / CSV Data Cleaning Service (pandas)

Turn a **messy client export** — duplicates, broken encodings, six phone
formats, eight date formats, inconsistent company names — into a clean,
analysis-ready **Excel file**, plus a **human-readable change report** the
client can review before signing off.

Everything runs **offline** on your own machine. No API, no internet, no data
leaving your computer — an easy pitch for privacy-conscious clients.

---

## What is inside

| File | What it does |
|---|---|
| `generate_messy.py` | Creates `messy_sample.xlsx` — 200 rows of realistic dirt (demo input). Deterministic (`seed = 42`). |
| `clean_data.py` | The cleaning engine. Reads any `.xlsx` / `.csv`, writes `cleaned_output.xlsx` + `changes_report.md`. |
| `messy_sample.xlsx` | The generated dirty input (already committed for you). |
| `demo_output/cleaned_output.xlsx` | The deliverable: `cleaned` sheet + `summary` sheet. |
| `demo_output/changes_report.md` | Before/after statistics with concrete examples of every fix. |

## The mess it fixes

| Problem | Example found in the sample | Fix |
|---|---|---|
| Duplicate contacts | `Hicham Amrani` / `Hicham El Amrani` @ same company | exact + fuzzy de-duplication |
| Broken encoding | `FrÃ¨res Naciri` | repaired to `Frères Naciri` |
| Company names | `ZELLIGE DESIGN STUDIO SARL`, `zellige design studio s.a.` | `Zellige Design Studio SARL` / `SA` |
| E-mail obfuscation | `rachid [dot] sekkat (at) nordouestlogistique.ma` | `rachid.sekkat@nordouestlogistique.ma` |
| E-mail noise | `Mailto:X@Y.MA`, stray spaces, trailing dots | lowercased, trimmed |
| Dead e-mails | `reda.benjelloun@maisontazicm` | **emptied + flagged**, never guessed |
| Phones | `0021262876769`, `+212 6 27 28 61 09`, `0640281491`, `212 628206610` | `+2126…` (E.164) |
| Dates | `11/11/2023`, `2023-11-11`, `12-Mar-24`, `Mar 12, 2024`, `12 mars 2024` | `2023-11-11` (ISO) |
| Cities | `casablanca`, `CASA`, ` Kénitra ` | `Casablanca`, `Kénitra` |
| Whitespace | non-breaking spaces, double spaces, newlines | collapsed |

## How to run

```bash
pip install -r requirements.txt

# 1. regenerate the demo input (optional — messy_sample.xlsx is included)
python generate_messy.py

# 2. clean it
python clean_data.py

# 3. clean a client file instead
python clean_data.py --input clients_export.csv --sheet 0 --out output
```

Options: `--input` (file), `--sheet` (name or index), `--out-dir`, `--name`.

Expected console output:

```
Wrote messy_sample.xlsx: 200 rows, 187 distinct contact names.
Rows in : 200
Rows out: 140  (60 duplicates removed, 6 kept for review)
XLSX    : demo_output\cleaned_output.xlsx
Report  : demo_output\changes_report.md
```

## How de-duplication works

1. **Exact** — same normalized e-mail or same phone number ⇒ duplicate.
2. **Fuzzy** — same company (accent- and suffix-insensitive key) **and** ≥ 85 %
   name similarity (RapidFuzz `token_set_ratio`; falls back to `difflib` if
   RapidFuzz is not installed).
3. The **most complete** row wins (more filled fields), and the merge order is
   kept in the report.
4. Pairs scoring 70–84 % are **kept and listed** as "near-duplicates for
   review" — silently merging people is dangerous, so the tool leaves the last
   call to a human.

## Honest limitations (say this to clients)

- Dates are parsed **day-first** (`12/03/2024` = 12 March) — the French /
  Moroccan convention. Ambiguous dates are listed for review.
- Unparseable e-mails/phones are emptied and reported, **not guessed**.
- Custom column names can be mapped in `clean_data.py` (`COLUMNS` list).
- The fuzzy threshold is a judgement call: tune `FUZZY_THRESHOLD` per client.

## Why this is a good service to sell

- Deliverable = **file + written report**, easy to explain, easy to invoice.
- Fully repeatable: the same input always gives the same output.
- Works on Excel *and* CSV, any language/encoding (UTF-8, Latin-1, Windows-1252).
- Fast upsell: scheduled clean-up of a client's weekly export, or a small
  Streamlit UI on top of the same script.
