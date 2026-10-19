# Google Maps Business Scraper (Python + Playwright)

Extract business listings — **name, category, address, city, phone, website,
rating and review count** — from a Google Maps search, and export them as a
de-duplicated **CSV + XLSX** file ready for Excel, a CRM or a lead-list tool.

> ⚠️ **Please read before you scrape anything** — legal / ToS notes are at the
> bottom of this file. In production, use the **Google Places API** instead.

---

## What is inside

| File | What it does |
|---|---|
| `scraper_playwright.py` | **Variant A – full scraper.** Types your search into Google Maps, scrolls the results, opens each business to collect phone + website. |
| `scraper_dom.py` | **Variant B – simple, robust extractor.** Takes a Google Maps URL *or a saved HTML page* and pulls the visible listing data straight from the DOM. Works **fully offline**. |
| `listing_parser.py` | The shared HTML → data parser (all Google CSS selectors live here). |
| `io_utils.py` | De-duplication + CSV/XLSX export helpers. |
| `sample_page.html` | An offline demo page that mimics Google Maps' DOM (10 Moroccan businesses + 1 duplicate). |
| `demo_output/` | The deliverable files produced by running the scripts on the sample page. |

## Requirements

* Python 3.10 or newer
* `pip install -r requirements.txt`
* For the browser variants only: `python -m playwright install chromium`

## How to run

### 1. Offline demo (works on any machine, no browser, no internet) — start here

```bash
python scraper_dom.py --html sample_page.html --out demo_output --name sample_output
```

Output:

* `demo_output/sample_output.csv`
* `demo_output/sample_output.xlsx`

The sample page contains 10 realistic Moroccan business listings plus 1
deliberate duplicate — you will see **11 extracted, 1 removed, 10 kept**.

### 2. From a saved Google Maps page (recommended real-world workflow)

1. Search on Google Maps in Chrome.
2. Scroll the results you want.
3. `Right-click → Save page as… → Webpage, HTML only`.
4. Run:

```bash
python scraper_dom.py --html my_saved_page.html --out output
```

This is the most reliable method: you control exactly which results are
captured, and the scraper never touches Google's servers.

### 3. Variant A — the automatic scraper

```bash
python scraper_playwright.py --query "restaurant in Casablanca" --max-results 20
python scraper_playwright.py --query "immobilier Rabat" --headed --delay 3
```

Useful flags: `--headed` (watch the browser), `--delay` (seconds between
actions — keep it ≥ 2), `--max-results`, `--no-details` (much faster, skips
opening each place), `--url` (paste a full Maps URL instead of a query).

Offline self-test of the same pipeline:

```bash
python scraper_playwright.py --self-test --out demo_output
```

## Output format

| Column | Example |
|---|---|
| `name` | Le Jasmin Restaurant |
| `category` | Restaurant |
| `address` | Rue Jean Jaurès, Maârif, Casablanca |
| `city` | Casablanca |
| `phone` | +212 522 27 45 12 |
| `website` | https://www.lejasmin-casa.ma |
| `rating` | 4.5 |
| `reviews` | 312 |
| `place_url` | https://www.google.com/maps/place/… |
| `source_url` | the page the row was extracted from |

Rows are de-duplicated on **name + city** and **phone number**.

## Honest limitations (tell your clients this)

* **Google blocks aggressive scraping.** Headless browsers get CAPTCHA'd or
  soft-blocked. Variant B + saved HTML avoids this almost entirely.
* **Google changes its markup.** When the parser stops matching, update the
  selectors in `listing_parser.py` (`SELECTORS` dictionary) — that is the only
  place they appear.
* **Phone numbers and websites are usually only on the place's detail page**,
  which is why Variant A clicks into each result.
* **This is a portfolio / small-volume tool**, not a SaaS scraper.

## The proper production method: Google Places API

For anything commercial or high-volume, use the official API — it is legal,
stable, and returns structured JSON (no DOM parsing):

```text
https://places.googleapis.com/v1/places:searchText
POST  with header X-Goog-Api-Key: YOUR_KEY
      body  { "textQuery": "restaurant in Casablanca", "languageCode": "en" }
```

Free monthly quota, ~USD 200 credit, returns name, formatted_address,
national_phone_number, website_uri, rating and user_rating_count directly.
I can integrate this for you as a paid deliverable.

## Legal / Terms of Service

* Scraping may violate Google's Terms of Service. This code is provided for
  **learning, testing on pages you own, and personal small-scale use**.
* In the EU and Morocco, personal-data rules (GDPR / Law 09-08) apply to
  contact data: get consent before storing or emailing people.
* For client work, prefer: the Google Places API, public directories that
  allow it, or manually exported data.
* Respect `robots.txt`, keep request rates low, and never resell scraped
  personal data.
