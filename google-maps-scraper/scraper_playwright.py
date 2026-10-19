#!/usr/bin/env python3
"""
scraper_playwright.py  --  VARIANT A (the "full" scraper)
=========================================================
Type a search into Google Maps, scroll the results, open each place and pull:
name, category, address, city, phone, website, rating, review count.

Flow:
  1. open https://www.google.com/maps/search/<query>
  2. accept the cookie/consent dialog if it appears
  3. scroll the results feed until no new results appear
  4. click each result to open its detail panel and read phone + website
  5. de-duplicate and save CSV + XLSX

Be a good citizen: keep --max-results small, keep --delay >= 2 s and only
scrape data you are allowed to collect. See README.md (legal/ToS notes and
the production-grade alternative: the Google Places API).

Usage
-----
    python scraper_playwright.py --query "restaurant in Casablanca" --max-results 20
    python scraper_playwright.py --query "immobilier Rabat" --headed          # watch it work

    # OFFLINE self-test: runs the same pipeline against the bundled sample page
    python scraper_playwright.py --self-test --out demo_output
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import urllib.parse

from io_utils import dedupe, die, log, save_outputs
from listing_parser import extract_listings

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLE_PAGE = os.path.join(HERE, "sample_page.html")


# ---------------------------------------------------------------------------
# Browser helpers
# ---------------------------------------------------------------------------

def _launch(args):
    """Start Chromium or explain exactly how to install it."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        die("Playwright is not installed.\n"
            "    pip install playwright\n"
            "    python -m playwright install chromium\n"
            "Tip: you can still demo the project offline with:\n"
            "    python scraper_dom.py --html sample_page.html")
    try:
        pw = sync_playwright().start()
        browser = pw.chromium.launch(headless=not args.headed)
        context = browser.new_context(
            locale="en-US",
            viewport={"width": 1440, "height": 960},
            # A normal-looking UA/viewport reduces the chance of instant blocking
            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"),
        )
        return pw, context
    except Exception as exc:
        die("Could not start the Playwright browser.\n"
            f"    {type(exc).__name__}: {exc}\n"
            "Install the browser engine with:\n"
            "    python -m playwright install chromium\n"
            "Or run the offline demo instead:\n"
            "    python scraper_dom.py --html sample_page.html")


def _dismiss_popups(page) -> None:
    """Best-effort close of the Google consent / sign-in dialogs."""
    for label in ("Accept all", "I agree", "Tout accepter", "Reject all"):
        try:
            btn = page.get_by_role("button", name=re.compile(label, re.I)).first
            if btn.is_visible(timeout=800):
                btn.click(timeout=2000)
                page.wait_for_timeout(1500)
                return
        except Exception:
            continue


# ---------------------------------------------------------------------------
# Collection
# ---------------------------------------------------------------------------

def collect_results(page, max_results: int, delay: float) -> list[dict]:
    """Scroll the results feed and collect every listing that appears."""
    listings: dict[tuple, dict] = {}
    stable_loops = 0
    loops = 0

    while len(listings) < max_results and stable_loops < 3 and loops < 60:
        loops += 1
        for row in extract_listings(page.content(), source_url=page.url):
            listings.setdefault((row["name"], row.get("city", "")), row)
            if len(listings) >= max_results:
                break

        feed = page.query_selector("div[role='feed']")
        if feed is None:                     # single-result page: nothing to scroll
            break
        before = len(page.query_selector_all("a.hfpxzc"))
        feed.evaluate("el => el.scrollBy(0, el.clientHeight * 2)")
        page.wait_for_timeout(int(delay * 1000))
        after = len(page.query_selector_all("a.hfpxzc"))
        stable_loops = 0 if after > before else stable_loops + 1

    return list(listings.values())[:max_results]


def _panel_text(page, selector: str) -> str:
    try:
        el = page.query_selector(selector)
        if not el:
            return ""
        return re.sub(r"\s+", " ", (el.get_attribute("aria-label") or el.inner_text() or "")).strip()
    except Exception:
        return ""


def enrich_details(page, listings: list[dict], delay: float) -> None:
    """Open every place and fill in phone / website / address when missing."""
    links = page.query_selector_all("a.hfpxzc")
    href_to_link = {}
    for link in links:
        href = link.get_attribute("href") or ""
        if href:
            href_to_link[href] = link

    for i, row in enumerate(listings, start=1):
        link = href_to_link.get(row.get("place_url", ""))
        if link is None:
            continue
        try:
            link.click()
            page.wait_for_timeout(int(delay * 1000))

            if not row.get("phone"):
                raw = _panel_text(page, "button[data-item-id^='phone']")
                m = re.search(r"[\d+][\d\s.\-()]{7,}", raw)
                row["phone"] = m.group(0).strip() if m else raw
            if not row.get("website"):
                row["website"] = _panel_text(page, "a[data-item-id='authority']")
            if not row.get("address"):
                row["address"] = _panel_text(page, "button[data-item-itemid^='address']") \
                    .replace("Address: ", "")
            row["place_url"] = page.url
            log(f"  [{i}/{len(listings)}] {row['name']} "
                f"-> phone={'yes' if row['phone'] else 'no'} "
                f"website={'yes' if row['website'] else 'no'}")
        except Exception as exc:             # never let one bad result kill the run
            log(f"  [{i}/{len(listings)}] skipped {row.get('name')}: {exc}")
        finally:
            try:
                page.go_back(wait_until="domcontentloaded")
                page.wait_for_timeout(600)
            except Exception:
                pass


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="Google Maps search-results scraper (Playwright).")
    ap.add_argument("--query", help='Search text, e.g. "restaurant in Casablanca".')
    ap.add_argument("--url", help="Or paste a full Google Maps search URL.")
    ap.add_argument("--max-results", type=int, default=20, help="Stop after N businesses (default 20).")
    ap.add_argument("--delay", type=float, default=2.5, help="Seconds between actions (default 2.5).")
    ap.add_argument("--headed", action="store_true", help="Show the browser window.")
    ap.add_argument("--no-details", action="store_true",
                    help="Skip clicking each place (much faster, but no phone/website).")
    ap.add_argument("--self-test", action="store_true",
                    help="Run the pipeline on the bundled offline sample page.")
    ap.add_argument("--out", default="demo_output", help="Output folder (default: demo_output).")
    ap.add_argument("--name", default="google_maps_listings", help="Output file base name.")
    args = ap.parse_args()

    # --- build the target URL ------------------------------------------------
    if args.self_test:
        target = "file://" + SAMPLE_PAGE.replace("\\", "/")
        args.name = args.name if args.name != "google_maps_listings" else "playwright_selftest"
        args.no_details = True                 # nothing to click on a static fixture
        log(f"SELF-TEST mode: using the bundled page {SAMPLE_PAGE}")
    elif args.url:
        target = args.url
    elif args.query:
        target = "https://www.google.com/maps/search/" + urllib.parse.quote(args.query) + "?hl=en"
    else:
        ap.error("Provide --query, --url, or --self-test.")

    pw, context = _launch(args)
    try:
        page = context.new_page()
        log(f"Opening {target}")
        page.goto(target, timeout=90_000, wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        _dismiss_popups(page)

        # Wait for at least one result card (or time out with a clear message)
        try:
            page.wait_for_selector("div.Nv2PK, a.hfpxzc", timeout=20_000)
        except Exception:
            die("No results rendered on the page.\n"
                "Google may be showing a CAPTCHA, a consent screen, or the\n"
                "query returned nothing. Try --headed to see what is happening,\n"
                "or run the offline demo:  python scraper_dom.py --html sample_page.html")

        log("Collecting results (scrolling) ...")
        listings = collect_results(page, args.max_results, args.delay)
        if not listings:
            die("The page loaded but no listing could be parsed.")

        if not args.no_details:
            log("Opening each place to collect phone + website ...")
            enrich_details(page, listings, args.delay)

        clean, removed = dedupe(listings)
        paths = save_outputs(clean, args.out, args.name)
        log(f"Done: {len(listings)} listings, {removed} duplicate(s) removed.")
        log(f"CSV : {paths['csv']}")
        log(f"XLSX: {paths['xlsx']}")
    finally:
        try:
            context.close()
            pw.stop()
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
