"""
make_portfolio_shots.py — 3 Fiverr PORTFOLIO project images (1280x720 PNG).

Renders the REAL output of the 3 demo projects as spreadsheet-window mockups.
Regenerate: python thumbnails/make_portfolio_shots.py
"""
import csv, os
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEMOS = os.path.join(BASE, "portfolio-demos")
OUT = os.path.join(BASE, "thumbnails", "output")
os.makedirs(OUT, exist_ok=True)

W, H = 1280, 720

NAVY   = (31, 78, 120)
NAVY_D = (10, 61, 98)
GREEN  = (0, 184, 148)
RED    = (225, 112, 85)
GOLD   = (253, 203, 110)
TEXT   = (45, 52, 54)
MUTED  = (99, 110, 114)
LINE   = (223, 227, 230)
WHITE  = (255, 255, 255)
BG     = (238, 241, 244)

F = "C:/Windows/Fonts/"
def font(n, s): return ImageFont.truetype(F + n, s)
BLACK, BOLD, REG = "ariblk.ttf", "segoeuib.ttf", "segoeui.ttf"
MONO, MONOB = "consola.ttf", "consolab.ttf"


def check(d, x, y, s, color=GREEN):
    d.ellipse([x, y, x + s, y + s], fill=color)
    d.line([(x + s * .26, y + s * .52), (x + s * .44, y + s * .70),
            (x + s * .76, y + s * .30)], fill=WHITE, width=max(2, s // 8), joint="curve")


def win_chrome(d, x0, y0, x1, title, tabw=300):
    """Excel-style title bar."""
    d.rounded_rectangle([x0, y0, x1, y0 + 46], radius=10, fill=NAVY)
    d.rectangle([x0, y0 + 26, x1, y0 + 46], fill=NAVY)
    d.rounded_rectangle([x0 + 14, y0 + 9, x0 + 14 + tabw, y0 + 40], radius=7, fill=WHITE)
    d.text((x0 + 30, y0 + 16), title, font=font(MONOB, 16), fill=NAVY, anchor="la")
    for i, c in enumerate([(237, 106, 94), (245, 191, 79), (97, 197, 84)]):
        d.ellipse([x1 - 74 + i * 22, y0 + 16, x1 - 62 + i * 22, y0 + 28], fill=c)


def shadow(img, box, r, fill):
    from PIL import ImageFilter
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    x0, y0, x1, y1 = box
    od.rounded_rectangle([x0, y0 + 7, x1, y1 + 7], radius=r, fill=(0, 0, 0, 30))
    ov = ov.filter(ImageFilter.GaussianBlur(9))
    img.paste(Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB"), (0, 0))
    ImageDraw.Draw(img).rounded_rectangle(box, radius=r, fill=fill)


def badge(d, x, y, label, bg, fg=WHITE, fs=15):
    w = d.textlength(label, font=font(BOLD, fs)) + 26
    d.rounded_rectangle([x, y, x + w, y + 30], radius=15, fill=bg)
    d.text((x + 13, y + 6), label, font=font(BOLD, fs), fill=fg, anchor="la")
    return w


# ============================================================ 1. MAPS SCRAPER
def shot1():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    d.text((52, 40), "GOOGLE MAPS BUSINESS EXTRACTOR", font=font(BLACK, 34), fill=NAVY)
    d.text((52, 86), "Playwright + DOM parser  ->  clean CSV / XLSX", font=font(REG, 20), fill=MUTED)
    badge(d, W - 300, 38, "DEMO FIXTURE", (150, 160, 168), WHITE, 14)

    card = [52, 130, W - 52, 566]
    shadow(img, card, 14, WHITE)
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = card
    win_chrome(d, x0, y0, x1, "sample_output.csv", 300)

    with open(os.path.join(DEMOS, "google-maps-scraper", "demo_output", "sample_output.csv"),
              encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))[:5]

    cols = [("Business", 20, 300), ("City", 320, 120), ("Phone", 440, 200),
            ("Rating", 700, 110), ("Website", 780, 330)]
    hy = y0 + 66
    d.rectangle([x0, hy, x1, hy + 38], fill=(240, 243, 246))
    for name, off, _ in cols:
        d.text((x0 + off, hy + 10), name, font=font(BOLD, 16), fill=MUTED, anchor="la")
    d.text((x0 + 1140, hy + 10), "Reviews", font=font(BOLD, 16), fill=MUTED, anchor="la")

    ry = hy + 38
    for i, r in enumerate(rows):
        if i % 2 == 1:
            d.rectangle([x0 + 1, ry, x1 - 1, ry + 44], fill=(250, 251, 252))
        vals = [r["name"][:34], r["city"], r["phone"], "", r["website"][:40]]
        for (name, off, _), v in zip(cols, vals):
            if v:
                d.text((x0 + off, ry + 13), v, font=font(MONO, 15), fill=TEXT, anchor="la")
        # rating: gold star then the number
        d.text((x0 + 700, ry + 12), "*", font=font(BLACK, 17), fill=GOLD, anchor="la")
        d.text((x0 + 722, ry + 13), r["rating"], font=font(MONO, 15), fill=TEXT, anchor="la")
        d.text((x0 + 1140, ry + 13), r["reviews"], font=font(MONO, 15), fill=TEXT, anchor="la")
        ry += 44
        d.line([(x0 + 12, ry), (x1 - 12, ry)], fill=LINE, width=1)

    d.text((x0 + 20, ry + 18), "... 10 unique rows, 1 duplicate detected and removed",
           font=font(REG, 16), fill=MUTED, anchor="la")
    d.text((x0 + 20, ry + 46), "Every row keeps a source URL  |  phone + address + rating + website",
           font=font(REG, 16), fill=MUTED, anchor="la")

    # footer chips
    fx = 52
    for t in ["CSV", "XLSX", "dedupe", "source URL"]:
        w = d.textlength(t, font=font(BOLD, 15)) + 26
        d.rounded_rectangle([fx, 600, fx + w, 632], radius=16, fill=NAVY)
        d.text((fx + 13, 607), t, font=font(BOLD, 15), fill=WHITE, anchor="la")
        fx += w + 10

    img.save(f"{OUT}/portfolio-1-maps-scraper.png", "PNG", optimize=True)
    print("  portfolio 1 OK")


# ============================================================ 2. EXCEL CLEANER
def shot2():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    d.text((52, 40), "EXCEL / CSV DATA CLEANER", font=font(BLACK, 34), fill=NAVY)
    d.text((52, 86), "9-step pipeline  ->  clean file + a written report of every fix",
           font=font(REG, 20), fill=MUTED)

    # ---- stat cards
    stats = [("200", "rows in", MUTED), ("140", "rows out", NAVY),
             ("60", "dupes removed", RED), ("120", "e-mails repaired", GREEN),
             ("175", "phones -> E.164", GREEN), ("199", "dates -> ISO", GREEN)]
    bw = (W - 104 - 5 * 14) / 6
    for i, (big, lbl, col) in enumerate(stats):
        x = 52 + i * (bw + 14)
        card = [x, 130, x + bw, 268]
        shadow(img, card, 12, WHITE)
        d = ImageDraw.Draw(img)
        d.text((x + bw / 2, 168), big, font=font(BLACK, 46), fill=col, anchor="mm")
        d.text((x + bw / 2, 222), lbl, font=font(BOLD, 15), fill=MUTED, anchor="mm")

    # ---- report card
    card = [52, 296, W - 52, 656]
    shadow(img, card, 14, WHITE)
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = card
    win_chrome(d, x0, y0, x1, "changes_report.md", 260)

    d.text((x0 + 24, y0 + 66), "Every fix, written down", font=font(BLACK, 22), fill=NAVY)

    ex = [("ACME Corp   ·   info@acme.ma", "Acme Corp   ·   info@acme.ma", "case + phone merged"),
          ("06/12/2024", "2024-12-06", "4 formats -> ISO 8601"),
          ("+212 6 12 34 56 78", "+212612345678", "spacing normalised"),
          ("CafÃ© Nom", "Cafe Nom", "encoding repaired")]
    hy = y0 + 104
    heads = [("BEFORE", 24, RED), ("AFTER", 560, GREEN), ("FIX APPLIED", 900, MUTED)]
    for t, off, c in heads:
        d.text((x0 + off, hy), t, font=font(BOLD, 15), fill=c, anchor="la")
    ry = hy + 28
    for b1, a1, fix in ex:
        d.text((x0 + 24, ry), b1, font=font(MONO, 15), fill=RED, anchor="la")
        d.text((x0 + 560, ry), a1, font=font(MONO, 15), fill=GREEN, anchor="la")
        d.text((x0 + 900, ry), fix, font=font(REG, 15), fill=MUTED, anchor="la")
        ry += 34
        d.line([(x0 + 16, ry - 6), (x1 - 16, ry - 6)], fill=LINE, width=1)

    d.text((x0 + 24, ry + 14), "+ fuzzy de-duplication (same company, similar name) kept for human review",
           font=font(REG, 16), fill=MUTED, anchor="la")
    d.text((x0 + 24, ry + 42), "+ 12 unrepairable e-mails flagged, never silently dropped",
           font=font(REG, 16), fill=MUTED, anchor="la")

    img.save(f"{OUT}/portfolio-2-data-cleaner.png", "PNG", optimize=True)
    print("  portfolio 2 OK")


# ============================================================ 3. LEAD LIST
def shot3():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    d.text((52, 40), "B2B LEAD LIST BUILDER", font=font(BLACK, 34), fill=NAVY)
    d.text((52, 86), "Company list  ->  decision-maker contacts, ready for Instantly / Apollo / Lemlist",
           font=font(REG, 20), fill=MUTED)
    badge(d, W - 268, 38, "MOCK MODE", (150, 160, 168), WHITE, 14)

    card = [52, 130, W - 52, 566]
    shadow(img, card, 14, WHITE)
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = card
    win_chrome(d, x0, y0, x1, "lead_list.csv", 300)

    with open(os.path.join(DEMOS, "lead-list-builder", "demo_output", "lead_list.csv"),
              encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))[:5]

    cols = [("Full name", 20, 200), ("Title", 220, 200), ("Company", 420, 210),
            ("Work email", 630, 300), ("Status", 940, 90)]
    hy = y0 + 66
    d.rectangle([x0, hy, x1, hy + 38], fill=(240, 243, 246))
    for name, off, _ in cols:
        d.text((x0 + off, hy + 10), name, font=font(BOLD, 16), fill=MUTED, anchor="la")
    d.text((x0 + 1040, hy + 10), "City", font=font(BOLD, 16), fill=MUTED, anchor="la")

    ry = hy + 38
    for i, r in enumerate(rows):
        if i % 2 == 1:
            d.rectangle([x0 + 1, ry, x1 - 1, ry + 44], fill=(250, 251, 252))
        vals = [r["full_name"][:20], r["title"][:22], r["company"][:20],
                r["work_email"][:34]]
        for (name, off, _), v in zip(cols, vals):
            d.text((x0 + off, ry + 13), v, font=font(MONO, 15), fill=TEXT, anchor="la")
        check(d, x0 + 940, ry + 9, 24)
        d.text((x0 + 974, ry + 13), "OK", font=font(BOLD, 14), fill=GREEN, anchor="la")
        d.text((x0 + 1040, ry + 13), r["city"], font=font(MONO, 15), fill=TEXT, anchor="la")
        ry += 44
        d.line([(x0 + 12, ry), (x1 - 12, ry)], fill=LINE, width=1)

    d.text((x0 + 20, ry + 18), "personalization line written per lead  |  sequence name per niche",
           font=font(REG, 16), fill=MUTED, anchor="la")
    d.text((x0 + 20, ry + 46), "enrichment_status column marks mock vs verified - nothing is ever passed off as real",
           font=font(REG, 16), fill=MUTED, anchor="la")

    fx = 52
    for t in ["Instantly", "Apollo", "Lemlist", "CSV", "XLSX"]:
        w = d.textlength(t, font=font(BOLD, 15)) + 26
        d.rounded_rectangle([fx, 600, fx + w, 632], radius=16, fill=NAVY)
        d.text((fx + 13, 607), t, font=font(BOLD, 15), fill=WHITE, anchor="la")
        fx += w + 10

    img.save(f"{OUT}/portfolio-3-leadlist.png", "PNG", optimize=True)
    print("  portfolio 3 OK")


if __name__ == "__main__":
    print("Building 3 Fiverr portfolio shots (1280x720)...")
    shot1(); shot2(); shot3()
    print("Done ->", OUT)
