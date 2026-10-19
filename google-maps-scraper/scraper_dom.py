#!/usr/bin/env python3
"""
scraper_dom.py  --  VARIANT B (recommended for beginners)
========================================================
"Give me the data that is already visible on this Google Maps page."

This is the simple, reliable variant: it takes a Google Maps search-results
URL (or, better, an HTML file you already saved from your browser) and
extracts the listing data straight from the DOM. It never scrolls, never
clicks and never drives the page, so it is much harder for Google to detect
... and it can run completely OFFLINE on a saved page.

Usage
-----
    # OFFLINE demo (no browser, no network, works on any machine):
    python scraper_dom.py --html sample_page.html --out demo_output

    # From a live URL (needs: pip install playwright && python -m playwright install chromium):
    python scraper_dom.py --url "https://www.google.com/maps/search/restaurant+in+Casablanca"

How to save the page yourself: open the Google Maps search in Chrome ->
right-click -> "Save page as..." -> "Webpage, HTML only", then pass it with
--html. Only use data you are allowed to collect (see README.md).
"""

from __future__ import annotations

import argparse
import os
import sys

from io_utils import dedupe, die, log, save_outputs
from listing_parser import extract_listings


def load_page_html(args) -> tuple[str, str]:
    """Return (html, source_url) from either --html or --url."""
    if args.html:
        if not os.path.isfile(args.html):
            die(f"HTML file not found: {args.html}")
        with open(args.html, "r", encoding="utf-8", errors="replace") as fh:
            return fh.read(), f"file://{os.path.abspath(args.html)}"

    # --url mode: render the page in a real (headless) browser first
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        die("Reading a live --url needs Playwright.\n"
            "    pip install playwright && python -m playwright install chromium\n"
            "Or use the offline mode instead:  --html saved_page.html")

    log(f"Rendering {args.url} in headless Chromium ...")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=not args.headed)
            page = browser.new_page(locale="en-US", viewport={"width": 1400, "height": 900})
            page.goto(args.url, timeout=60_000, wait_until="domcontentloaded")
            page.wait_for_timeout(4000)          # let the results list render
            html = page.content()
            browser.close()
    except Exception as exc:                     # network / blocked / no browser
        die("Could not load the page.\n"
            f"    {type(exc).__name__}: {exc}\n"
            "Common causes: no internet, Playwright browser not installed\n"
            "    (python -m playwright install chromium), or Google served a\n"
            "CAPTCHA / consent page. Try the offline demo instead:\n"
            "    python scraper_dom.py --html sample_page.html")
    return html, args.url


def main() -> int:
    ap = argparse.ArgumentParser(description="Extract visible Google Maps listings from a page.")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--url", help="Google Maps search-results URL (needs Playwright).")
    src.add_argument("--html", help="Path to a saved Google Maps HTML page (fully offline).")
    ap.add_argument("--out", default="demo_output", help="Output folder (default: demo_output).")
    ap.add_argument("--name", default="google_maps_listings", help="Output file base name.")
    ap.add_argument("--headed", action="store_true", help="Show the browser window (URL mode).")
    args = ap.parse_args()

    html, source_url = load_page_html(args)

    listings = extract_listings(html, source_url=source_url)
    if not listings:
        die("No listings found in the page.\n"
            "Possible reasons: the page contains no results, Google served a\n"
            "consent/CAPTCHA page, or the CSS selectors in listing_parser.py\n"
            "need to be updated (Google changes its markup regularly).")

    clean, removed = dedupe(listings)
    paths = save_outputs(clean, args.out, args.name)

    log(f"Extracted {len(listings)} listings -> {removed} duplicate(s) removed.")
    log(f"CSV : {paths['csv']}")
    log(f"XLSX: {paths['xlsx']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
