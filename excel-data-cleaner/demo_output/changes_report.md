# Data cleaning report

**Input:** `messy_sample.xlsx` — 200 rows
**Output:** `cleaned_output.xlsx` — 140 rows
**Generated:** 2026-10-19 20:44 · offline, reproducible

## Summary

| Metric | Value |
|---|---:|
| Rows in | 200 |
| Rows out | 140 |
| Duplicates removed | **60** |
| ↳ exact (same e-mail or phone) | 36 |
| ↳ fuzzy (same company + similar name) | 24 |
| Near-duplicates kept for human review | 6 |
| E-mails repaired | 120 |
| E-mails invalid → emptied | 12 |
| Phone numbers normalized to `+212…` | 175 |
| Phone numbers invalid → emptied | 0 |
| Dates parsed to ISO `YYYY-MM-DD` | 199 |
| Dates unparseable → emptied | 0 |
| Broken encodings repaired | 11 |
| Company names standardized | 43 |

## What was fixed

### Duplicate contacts removed
  - kept **Reda Benjelloun** (Maison Tazi) / removed **Reda Benjelloun** (Maison Tazi) — name similarity 100%
  - kept **Élodie Mrabet** (Maison Tazi) / removed **Élodie Mrabet** (Maison Tazi SAS) — name similarity 100%
  - kept **Hicham Amrani** (Wahda Distrib SARL) / removed **Hicham El Amrani** (Wahda Distrib) — name similarity 100%
  - kept **Hicham Naciri** (Union Textile) / removed **Hicham Naciri** (Union Textile) — name similarity 100%
  - kept **Yasmine Boukhris** (Ets. Benali) / removed **Yasmine Boukhris** (Ets. Benali) — name similarity 100%
  - kept **Yasmine Mansouri** (Ets. Benali SA) / removed **Yasmine Mansouri** (Ets. Benali) — name similarity 100%
  - kept **Amina Zerhouni** (Oujda Plastic) / removed **Amina Zerhouni** (Oujda Plastic) — name similarity 100%
  - kept **Manal Ouazzani** (Zellige Design Studio) / removed **Manal Ouazzani** (Zellige Design Studio SA) — name similarity 100%

### E-mails repaired (lowercased, `[at]`/`[dot]`, `mailto:`, stray spaces)
  - `hicham.el.amrani@wahdadistrib.ma.` → `hicham.el.amrani@wahdadistrib.ma`
  - `nadia.mansouri@cedreinformatique.ma.` → `nadia.mansouri@cedreinformatique.ma`
  - `samira.berrada[at]etsbenali.ma` → `samira.berrada@etsbenali.ma`
  - `khadija.filali[at]oujdaplastic.ma` → `khadija.filali@oujdaplastic.ma`
  - `rachid [dot] sekkat (at) nordouestlogistique.ma` → `rachid.sekkat@nordouestlogistique.ma`

### E-mails that could not be repaired (emptied, flagged for the client)
  - `reda.benjelloun@maisontazicm` → ``
  - `karim.mansouri@palmeraieeventscm` → ``
  - `yasmine.boukhris@etsbenalicm` → ``
  - `salma.tahiri@iriscosmeticscm` → ``
  - `samira.chekrouni@palmeraieeventscm` → ``

### Phone numbers (all Moroccan formats → E.164)
  - `+212 6 27 28 61 09` → `+212627286109`
  - `0640281491` → `+212640281491`
  - `+212 6 99 03 85 26` → `+212699038526`
  - `212 628206610` → `+212628206610`
  - `00212628767690` → `+212628767690`

### Dates (many formats → ISO 8601)
  - `11/11/2023` → `2023-11-11`
  - `2024-03-24 00:00:00` → `2024-03-24`
  - `03/10/2022` → `2022-10-03`
  - `09 December 2024` → `2024-12-09`
  - `22/06/2022` → `2022-06-22`

### Broken encodings (`RÃ©sidence` → `Résidence`)
  - `CÃ¨dre Informatique` → `Cèdre Informatique`
  - `Al Qods RÃ©sidence` → `Al Qods Résidence`
  - `CÃ¨dre Informatique` → `Cèdre Informatique`
  - `MÃ©dina Artisanat` → `Médina Artisanat`
  - `FÃ¨s Poterie Tradition` → `Fès Poterie Tradition`

## Assumptions & limits

- Dates are interpreted **day-first** (`12/03/2024` = 12 March 2024), the
  French/Moroccan convention. Ambiguous dates should be confirmed with the client.
- Fuzzy matching threshold: **85%** similarity on the contact name,
  within the same standardised company. Pairs between 70% and 85% are
  listed above as "kept for review" instead of being merged automatically.
- Unparseable e-mails/phones are **emptied, not guessed** — silently inventing
  contact data is worse than leaving a blank.
- Nothing was deleted from the source file; the cleaned file is a new sheet.
