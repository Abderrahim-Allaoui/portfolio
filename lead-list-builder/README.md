# B2B Lead List Builder (Python)

Turn a plain CSV of **company names + cities** into an **enriched B2B lead
list** — decision-maker name, job title, work e-mail, LinkedIn URL, phone,
city, country and a personalisation hook — formatted for cold-outreach tools
(**Instantly, Apollo, Lemlist, Snov.io**): the column names match what those
tools expect on CSV/XLSX import.

Runs **offline by default** (mock mode, no API key, no internet). Live
enrichment hooks switch on only when you provide an API key.

---

## What is inside

| File | What it does |
|---|---|
| `build_leads.py` | The whole pipeline: read CSV → enrich → de-duplicate → export XLSX + CSV. |
| `input_companies.csv` | Sample input: 16 fictional Moroccan companies. |
| `demo_output/lead_list.xlsx` | Deliverable: `leads` sheet + `summary` sheet. |
| `demo_output/lead_list.csv` | Same data as CSV (UTF-8 with BOM → opens cleanly in Excel). |

## How to run

```bash
pip install -r requirements.txt

# Default: mock mode, fully offline, deterministic
python build_leads.py

# Your own input file
python build_leads.py --input my_companies.csv --out-dir output

# Real enrichment (only when an API key is set)
set HUNTER_API_KEY=your_key_here      # Windows
python build_leads.py --mode real
```

Input CSV columns: `company` (required), `city`, `country`, `industry`,
`website`. Extra/missing columns are tolerated.

## Mock mode vs real mode (read this before showing a client)

| | Mock mode (default) | Real mode |
|---|---|---|
| Needs internet / API key | **No** | Yes |
| Data | Realistic **fake** contacts | Real contacts from the provider |
| Flagged in the file | `enrichment_status = mock` | `hunter` / `live_failed_mock_fallback` |
| Deterministic | Yes — same input = same output | No |
| Use case | Portfolio demo, pitching, testing the workflow | Actual client delivery |

The mock generator builds the e-mail from a **naming pattern**
(`first.last@company.ma`, `flast@…`, `first@…`), picks a plausible title for
the industry, and invents a LinkedIn URL — exactly what a pattern-based
enrichment does, minus the verification. **Never present mock rows as real
people**; the `enrichment_status` and `notes` columns exist so nobody can mix
them up by accident.

## Real enrichment hooks

- **Hunter.io — implemented.** Set `HUNTER_API_KEY`, run `--mode real`. Uses
  the domain-search endpoint (`/v2/domain-search`) and keeps the result with
  the highest confidence; credits are consumed per call, so mind your plan.
- **Apollo — documented stub.** `APOLLO_API_KEY` is read, but the endpoint
  shape depends on your plan/version, so `enrich_apollo()` contains step-by-step
  instructions instead of a blind call. Drop your implementation in and it works
  with `--provider apollo`.
- Any row that fails live enrichment **falls back to mock data** and is marked
  `live_failed_mock_fallback`, so a half-finished run still yields a usable file.

## Output columns

`first_name, last_name, full_name, title, company, industry, company_website,
work_email, email_status, linkedin_url, phone, city, country, source,
enrichment_status, personalization, sequence_name, notes`

- `email_status`: `verified` / `likely` (in mock mode this is a demo value).
- `personalization`: one-line opener referencing the company, city and industry.
- `sequence_name`: pre-grouped by industry + country for your campaign structure.
- De-duplication: one row per e-mail address.

## Honest limitations

- Mock contacts are **not real people** and the e-mails are **not deliverable**.
  That is the point of the demo — but say so out loud in every proposal.
- A real production build should add: e-mail verification (ZeroBounce,
  Reoon), domain MX checks, and bounce-rate feedback loops.
- Respect anti-spam rules (CAN-SPAM, GDPR, Morocco's Law 09-08) and each
  platform's terms when you run real campaigns.

## Typical service package to sell

1. "I build you a targeted lead list of 500 companies in your city/industry."
2. Deliver `lead_list.xlsx` + CSV ready for Instantly/Apollo/Lemlist.
3. Upsell: monthly refresh, e-mail verification, and the outreach sequence copy.
