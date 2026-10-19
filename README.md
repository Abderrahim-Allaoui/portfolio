# Data & Lead Generation Portfolio

**Abderrahim Allaoui** â€” B2B lead generation, web scraping & workflow automation.
Arabic Â· French Â· English (native/fluent/fluent) Â· Morocco

I build the boring layer of a business: collecting the right data, cleaning it,
and wiring up the repetitive work so it runs itself. Every demo below is
**runnable on your own machine** â€” clone it, install one file, run one command.

---

## The three demos

| # | Project | What it does | Run it | Deliverable you'll see |
|---|---------|--------------|--------|-------------------------|
| 1 | **Google Maps scraper** | Extracts business data (name, category, address, phone, website, rating, reviews) from a Maps results page into CSV/XLSX | `python scraper_dom.py --html sample_page.html --out demo_output --name sample_output` | 10 Moroccan businesses with full contact data |
| 2 | **Excel / CSV cleaner** | 9-step pipeline: fuzzy de-duplication, phone â†’ E.164, date â†’ ISO, encoding repair, validation, change report | `python generate_messy.py && python clean_data.py` | 200 dirty rows â†’ 140 clean rows + a written report of every fix |
| 3 | **B2B lead list builder** | Turns a company list into a structured lead list in Instantly / Apollo / Lemlist import format, with enrichment hooks | `python build_leads.py` | 16 enriched leads with source URL, verification status and notes |

---

## 1. Google Maps scraper

Two interchangeable variants behind one shared parser:

- `scraper_dom.py` â€” parse a saved HTML page or a live URL (no browser needed)
- `scraper_playwright.py` â€” full browser run: query â†’ scroll â†’ open each listing

```
google-maps-scraper/
â”œâ”€â”€ listing_parser.py         # all selectors in one dict â€” swap per market
â”œâ”€â”€ scraper_dom.py            # variant B
â”œâ”€â”€ scraper_playwright.py     # variant A (browser)
â”œâ”€â”€ io_utils.py               # dedupe + CSV/XLSX export
â”œâ”€â”€ sample_page.html          # offline fixture: 10 businesses + 1 duplicate
â””â”€â”€ demo_output/
```

**Verified on the full pipeline:** 11 records extracted â†’ 1 duplicate detected
and removed â†’ 10 unique rows exported, with a Playwright self-test run
producing the identical result.

> Live scraping can trigger a CAPTCHA. For production I use the **Google Places
> API** instead â€” the README documents the switch, including the cost model.

## 2. Excel / CSV cleaner

`generate_messy.py` builds a deliberately broken 200-row file (seeded, so it's
reproducible). `clean_data.py` then fixes it and writes a report:

| Metric | Result |
|--------|--------|
| Rows in â†’ out | 200 â†’ 140 |
| Duplicates removed | 60 (36 exact + 24 fuzzy) |
| E-mails repaired | 120 |
| E-mails unrepairable (flagged) | 12 |
| Phone numbers normalised to E.164 | 175 |
| Dates normalised to ISO 8601 | 199 |
| Broken encodings (mojibake) fixed | 11 |

Phones are forced to text so Excel never silently converts `+212â€¦` into a
number and destroys the leading `+`.

## 3. B2B lead list builder

`build_leads.py` takes a raw company list and produces a structured lead list:
first name, last name, title, company, domain, verified email, phone, city,
country, source URL, enrichment status and notes â€” directly importable into
Instantly, Apollo or Lemlist.

- `--mode mock` (default) â€” fully offline, deterministic, safe to screen-share
- `--mode real` â€” activates the enrichment hooks when `HUNTER_API_KEY` is set

> Demo rows are **flagged as mock in the data itself** (`enrichment_status =
> mock`). I never present sample data as real people.

---

## Quick start

```bash
git clone https://github.com/Abderrahim-Allaoui/portfolio.git
cd portfolio

cd google-maps-scraper   && pip install -r requirements.txt
cd ../excel-data-cleaner && pip install -r requirements.txt
cd ../lead-list-builder  && pip install -r requirements.txt
```

Python 3.10+. No paid API is called by default â€” every demo runs offline.
Project 1 needs `python -m playwright install chromium` only for the
browser-based runs.

---

## How I work

1. You send the spec, or we define it together in a 10-minute call
2. I confirm scope, price and delivery date **in writing**
3. I deliver working output, with a short screen recording showing it runs
4. One round of revisions included

## Tools

Python Â· BeautifulSoup Â· Scrapy Â· Playwright Â· Selenium Â· pandas Â· openpyxl
n8n Â· Make.com Â· Zapier Â· Excel / Google Sheets Â· Power Query

---

## Languages

I deliver in **Arabic, French and English** â€” the source data, the outreach
copy, the client conversation and the final deliverable. Most lead lists in
the MENA and Francophone Africa markets are built by someone who can't read
the page they scraped; that's the gap I work in.

---

## Contact

Available on Fiverr and Upwork. Message me with your project and I'll come
back with an approach, a timeline and a fixed price.
