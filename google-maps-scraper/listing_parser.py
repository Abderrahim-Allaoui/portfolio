"""
listing_parser.py
=================
Shared extraction logic used by BOTH scraper variants:

  * scraper_dom.py        -> loads a page (or a saved HTML file) and parses it
  * scraper_playwright.py -> drives a real browser, then hands the page HTML here

The parser works on the *visible listing cards* of a Google Maps search-results
page. Every CSS selector Google currently uses is declared once, in SELECTORS,
so when Google changes its markup you only have to update this dictionary.

NOTE: phone numbers and website URLs are usually only shown on the detail panel
of a place, not in the result list. scraper_playwright.py opens each result to
collect them; the DOM variant picks them up when they happen to be present.
"""

from __future__ import annotations

import re
from urllib.parse import urlparse

# ---------------------------------------------------------------------------
# Google Maps selectors (update here if Google changes its markup)
# ---------------------------------------------------------------------------
SELECTORS = {
    # A result card in the left-hand list
    "cards": "div.Nv2PK",
    # Fallback: direct children of the results feed that contain a place link
    "feed": "div[role='feed'] > div",
    "place_link": "a[href*='/maps/place/']",
    # Card internals
    "title": ".qBF1Pd",
    "category": ".DkEaL",
    "rating": ".MW4etd",
    "reviews": ".UY7F9",
    "any_line": "span.W4Efsd, span.LrzXr, div.W4Efsd",
    # Detail panel (used by the Playwright variant after clicking a result)
    "panel_phone": "button[data-item-id^='phone']",
    "panel_website": "a[data-item-id='authority']",
    "panel_address": "button[data-item-itemid^='address']",
    "panel_title": "h1.DUwDvf",
}

# --- Regexes used to classify the free-text lines inside a card -------------
PHONE_RE = re.compile(r"(?:\+?\s?212|00212|0)\s?[5-7](?:[\s.\-]?\d{2}){4}")
RATING_RE = re.compile(r"(\d+[.,]?\d*)\s*★")
REVIEWS_RE = re.compile(r"\(\s*([\d][\d\s.,]*)\s*\)")
# Words that mark an "opening hours" line so we never treat it as an address
HOURS_HINTS = (
    "open", "closed", "closes", "opens", "⋅", "hours",
    "ouvre", "fermé", "ferme", "horaire",
)
# Street / neighbourhood markers used to recognise an address line
ADDRESS_HINTS = (
    "rue", "avenue", "boulevard", "bd ", "route", "quartier", "angle",
    "imm.", "cité", "residence", "résidence", "hay ", "lotissement",
    "street", "st ", "road", "district", "n°", "nr ", "bp ",
)

# Moroccan cities used to fill the `city` column
MOROCCAN_CITIES = [
    "Casablanca", "Rabat", "Marrakech", "Marrakesh", "Tanger", "Tangier",
    "Fès", "Fes", "Agadir", "Meknès", "Meknes", "Oujda", "Kénitra", "Kenitra",
    "Salé", "Sala", "Tétouan", "Tetouan", "El Jadida", "Nador", "Béni Mellal",
    "Beni Mellal", "Mohammedia", "Khouribga", "Settat", "Safi", "Berrchid",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _norm(text: str) -> str:
    """Collapse whitespace and strip; return '' for None."""
    return re.sub(r"\s+", " ", (text or "")).strip()


def _detect_city(*texts: str) -> str:
    blob = " ".join(t for t in texts if t)
    for city in MOROCCAN_CITIES:
        if re.search(rf"\b{re.escape(city)}\b", blob, flags=re.IGNORECASE):
            # Return the canonical spelling (with accents)
            return city
    return ""


def _is_hours_line(line: str) -> bool:
    low = line.lower()
    return any(h in low for h in HOURS_HINTS)


def _looks_like_address(line: str) -> bool:
    low = line.lower()
    if any(h in low for h in ADDRESS_HINTS):
        return True
    if _detect_city(line):                       # contains a known city name
        return True
    # Real address snippets are usually comma-separated ("Derb Jdid, Guéliz, Marrakech")
    return "," in line and len(line) >= 10


def _guess_place_name(label: str) -> str:
    """`aria-label` looks like 'Le Jasmin Restaurant - Restaurant in Casablanca'."""
    return _norm(label.split(" - ")[0]) if label else ""


# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------

def find_cards(soup):
    """Return the list of result-card BeautifulSoup tags found in the page."""
    cards = soup.select(SELECTORS["cards"])
    if cards:
        return cards
    # Fallback: any direct child of the results feed that holds a place link
    return [
        c for c in soup.select(SELECTORS["feed"])
        if c.select_one(SELECTORS["place_link"])
    ]


def extract_listings(html: str, source_url: str = "") -> list[dict]:
    """Parse raw Google Maps search-results HTML into a list of dicts."""
    from bs4 import BeautifulSoup  # imported lazily so bs4 is only required here

    soup = BeautifulSoup(html, "lxml" if _lxml_available() else "html.parser")
    out: list[dict] = []

    for card in find_cards(soup):
        # --- title -----------------------------------------------------------
        title_el = card.select_one(SELECTORS["title"])
        link_el = card.select_one(SELECTORS["place_link"])
        name = _norm(title_el.get_text()) if title_el else _guess_place_name(
            link_el.get("aria-label", "") if link_el else "")
        if not name and link_el:
            name = _guess_place_name(link_el.get("aria-label", ""))
        if not name:
            continue  # not a real listing card

        # --- category --------------------------------------------------------
        cat_el = card.select_one(SELECTORS["category"])
        category = _norm(cat_el.get_text()) if cat_el else ""

        # --- rating & review count (card level) ------------------------------
        rating, reviews = "", ""
        r_el = card.select_one(SELECTORS["rating"])
        if r_el:
            rating = _norm(r_el.get_text()).replace(",", ".")
        rv_el = card.select_one(SELECTORS["reviews"])
        if rv_el:
            reviews = re.sub(r"\D", "", rv_el.get_text())

        # --- walk every text line of the card and classify it ----------------
        # One line can carry several facts, e.g. "4,5 ★ (312) Rue X, Maârif, Casablanca"
        address, phone, website = "", "", ""
        leftovers: list[str] = []
        for el in card.select(SELECTORS["any_line"]):
            line = _norm(el.get_text(" "))
            if not line or line == name:
                continue

            # Always strip recognised fragments from the line, even when the
            # value was already captured (one line can hold several facts).
            m = PHONE_RE.search(line)
            if m:
                phone = phone or _norm(m.group(0))
                line = line.replace(m.group(0), " ")
            m = RATING_RE.search(line)
            if m:
                rating = rating or m.group(1).replace(",", ".")
                line = line.replace(m.group(0), " ")
            m = REVIEWS_RE.search(line)
            if m:
                reviews = reviews or re.sub(r"\D", "", m.group(1))
                line = line.replace(m.group(0), " ")

            line = _norm(line)
            if not line or _is_hours_line(line):
                continue
            if not address and _looks_like_address(line):
                address = line
            elif not category and len(line) <= 40 and not re.search(r"\d", line):
                category = line
            else:
                leftovers.append(line)

        # last resort: the longest unclassified line is usually the address
        if not address and leftovers:
            address = max(leftovers, key=len)

        # website: the "Website" button of the card (skip Google's own links)
        for a in card.select("a[href^='http']"):
            href = a.get("href", "")
            host = urlparse(href).netloc
            if host and "google." not in host:
                website = href
                break

        # fallbacks: city can also come from the name, the aria-label or the URL
        place_url = link_el.get("href", "") if link_el else ""
        aria = link_el.get("aria-label", "") if link_el else ""
        city = (_detect_city(address) or _detect_city(name)
                or _detect_city(aria) or _detect_city(place_url.replace("+", " ")))

        out.append({
            "name": name,
            "category": category,
            "address": address,
            "city": city,
            "phone": phone,
            "website": website,
            "rating": rating,
            "reviews": reviews,
            "place_url": place_url,
            "source_url": source_url,
        })

    return out


def _lxml_available() -> bool:
    try:
        import lxml  # noqa: F401
        return True
    except Exception:
        return False


COLUMNS = ["name", "category", "address", "city", "phone", "website",
           "rating", "reviews", "place_url", "source_url"]
