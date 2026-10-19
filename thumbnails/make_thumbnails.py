"""
make_thumbnails.py — 3 Fiverr gig thumbnails (1280x769 PNG), built with PIL.

Brief: 13-THUMBNAILS.md
Palette: #1F4E78 navy / #00B894 green / #E17055 red / #FDCB6E gold
         #F8F9FA light / #0A3D62 dark navy / #2D3436 text

No faces, one idea per image, high contrast, fake data only (no real emails).
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
os.makedirs(OUT, exist_ok=True)

W, H = 1280, 769

# ---------------------------------------------------------------- palette
NAVY      = (31, 78, 120)
NAVY_DK   = (10, 61, 98)
GREEN     = (0, 184, 148)
RED       = (225, 112, 85)
GOLD      = (253, 203, 110)
LIGHT     = (248, 249, 250)
WHITE     = (255, 255, 255)
TEXT      = (45, 52, 54)
MUTED     = (99, 110, 114)
PALE_G    = (234, 250, 241)
PALE_R    = (253, 240, 237)
LINE      = (223, 227, 230)

F = "C:/Windows/Fonts/"
def font(name, size):
    return ImageFont.truetype(F + name, size)

BLACK   = "ariblk.ttf"      # Arial Black  -> Montserrat ExtraBold
BOLD    = "segoeuib.ttf"    # Segoe UI Bold
REG     = "segoeui.ttf"     # Segoe UI
MONO    = "consola.ttf"     # spreadsheet mockups
MONOB   = "consolab.ttf"


# ---------------------------------------------------------------- helpers
def check(d, x, y, s, color=GREEN, width=None):
    """Draw a filled circle with a white checkmark. x,y = top-left."""
    width = width or max(2, s // 8)
    d.ellipse([x, y, x + s, y + s], fill=color)
    m = s * 0.28
    d.line([(x + s * 0.26, y + s * 0.52), (x + s * 0.44, y + s * 0.70),
            (x + s * 0.76, y + s * 0.30)], fill=WHITE, width=width, joint="curve")


def cross(d, x, y, s, color=RED, width=None):
    width = width or max(2, s // 8)
    d.ellipse([x, y, x + s, y + s], outline=color, width=width)
    d.line([(x + s * 0.32, y + s * 0.32), (x + s * 0.68, y + s * 0.68)], fill=color, width=width)
    d.line([(x + s * 0.68, y + s * 0.32), (x + s * 0.32, y + s * 0.68)], fill=color, width=width)


def text_c(d, xy, s, f, fill, anchor="mm"):
    d.text(xy, s, font=f, fill=fill, anchor=anchor)


def text_l(d, xy, s, f, fill):
    d.text(xy, s, font=f, fill=fill, anchor="la")


def rounded(d, box, r, fill=None, outline=None, width=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def shadow_card(img, box, r, fill, shadow=(0, 0, 0, 26), offset=6):
    """Card with a soft drop shadow, drawn on a transparent overlay."""
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    x0, y0, x1, y1 = box
    od.rounded_rectangle([x0, y0 + offset, x1, y1 + offset], radius=r, fill=shadow)
    from PIL import ImageFilter
    ov = ov.filter(ImageFilter.GaussianBlur(7))
    img.paste(Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB"), (0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(box, radius=r, fill=fill)


# ================================================================ THUMB 1
def thumb1():
    """3-column split — VERIFIED B2B LEADS (the front door)."""
    img = Image.new("RGB", (W, H), LIGHT)
    d = ImageDraw.Draw(img)

    LW, MW = 486, 436          # left 38%, middle 34%
    RW = W - LW - MW           # right 28%

    d.rectangle([0, 0, LW, H], fill=LIGHT)
    d.rectangle([LW, 0, LW + MW, H], fill=WHITE)
    d.rectangle([LW + MW, 0, W, H], fill=NAVY)
    d.line([(LW, 0), (LW, H)], fill=LINE, width=2)
    d.line([(LW + MW, 0), (LW + MW, H)], fill=NAVY, width=3)

    # ---------------- LEFT
    x = 48
    # eyebrow
    d.rectangle([x, 92, x + 6, 92 + 30], fill=GREEN)
    text_l(d, (x + 20, 92), "VERIFIED", font(BLACK, 30), GREEN)
    text_l(d, (x, 136), "B2B LEADS", font(BLACK, 62), NAVY)
    d.rectangle([x, 226, x + 290, 233], fill=GREEN)

    text_l(d, (x, 266), "Morocco  ·  MENA  ·  Africa", font(BOLD, 25), TEXT)
    text_l(d, (x, 306), "Arabic  ·  French  ·  English", font(REG, 21), MUTED)

    # icon row
    iy = 404
    for i, label in enumerate(["SOURCED", "DEDUPED", "VERIFIED"]):
        ix = x + i * 144
        check(d, ix, iy, 38)
        text_l(d, (ix + 50, iy + 6), label, font(BOLD, 17), NAVY)

    # mini stat strip
    d.rectangle([x, 512, x + 390, 514], fill=LINE)
    text_l(d, (x, 540), "Source URL on every row", font(REG, 21), MUTED)
    text_l(d, (x, 578), "Bounce rate under 3%", font(REG, 21), MUTED)

    rounded(d, [x, 636, x + 246, 688], 26, fill=NAVY)
    text_c(d, (x + 123, 662), "Excel  ·  CSV  ·  Sheets", font(BOLD, 19), WHITE)

    # ---------------- MIDDLE — spreadsheet mockup
    card = [LW + 34, 132, LW + MW - 34, 620]
    shadow_card(img, card, 14, WHITE)
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = card

    d.rounded_rectangle([x0, y0, x1, y0 + 62], radius=14, fill=NAVY)
    d.rectangle([x0, y0 + 40, x1, y0 + 62], fill=NAVY)
    text_l(d, (x0 + 20, y0 + 18), "leads_casablanca.xlsx", font(MONOB, 19), WHITE)
    for i, c in enumerate([(237, 106, 94), (245, 191, 79), (97, 197, 84)]):
        d.ellipse([x1 - 74 + i * 22, y0 + 24, x1 - 62 + i * 22, y0 + 36], fill=c)

    hdr = ["Company", "Email", "Status"]
    cx = [x0 + 18, x0 + 172, x0 + 302]
    d.rectangle([x0, y0 + 62, x1, y0 + 96], fill=(238, 242, 245))
    for h, cxx in zip(hdr, cx):
        text_l(d, (cxx, y0 + 70), h, font(BOLD, 17), MUTED)

    rows = [("Acme Logistique", "a.maroc@..", True),
            ("Beta Import SARL", "contact@..", True),
            ("Gamma Tech", "g.info@..", True),
            ("Delta Distrib.", "d.sales@..", True)]
    ry = y0 + 104
    for i, (co, em, ok) in enumerate(rows):
        if i % 2 == 1:
            d.rectangle([x0 + 1, ry - 4, x1 - 1, ry + 34], fill=(250, 251, 252))
        text_l(d, (cx[0], ry), co, font(MONO, 15), TEXT)
        text_l(d, (cx[1], ry), em, font(MONO, 15), TEXT)
        check(d, cx[2], ry - 2, 24)
        text_l(d, (cx[2] + 32, ry + 2), "OK", font(BOLD, 15), GREEN)
        ry += 40
        if i < len(rows) - 1:
            d.line([(x0 + 12, ry - 6), (x1 - 12, ry - 6)], fill=LINE, width=1)

    text_l(d, (x0, y1 - 44), "real data, screenshot-ready", font(REG, 16), MUTED)

    # ---------------- RIGHT — 97% deliverability
    rx = LW + MW
    cxr = rx + RW / 2
    text_c(d, (cxr, 150), "97%", font(BLACK, 104), GOLD)
    text_c(d, (cxr, 228), "DELIVERABILITY", font(BOLD, 24), WHITE)

    d.rectangle([rx + 40, 272, rx + RW - 40, 274], fill=(70, 115, 155))

    items = ["SMTP verified", "Deduplicated", "Source URL cited"]
    iy = 318
    for it in items:
        check(d, rx + 48, iy, 32, GREEN)
        text_l(d, (rx + 92, iy + 4), it, font(BOLD, 23), WHITE)
        iy += 62

    rounded(d, [rx + 40, 540, rx + RW - 40, 618], 14, fill=NAVY_DK)
    text_c(d, (cxr, 566), "From $40", font(BLACK, 30), WHITE)
    text_c(d, (cxr, 600), "per 50 leads", font(REG, 18), (170, 200, 225))

    text_c(d, (cxr, 688), "Send me your niche — free 5-lead sample", font(REG, 17), (170, 200, 225))

    img.save(f"{OUT}/thumbnail-1-leadgen.png", "PNG", optimize=True)
    print("  thumb 1 OK  ->", f"{OUT}/thumbnail-1-leadgen.png")


# ================================================================ THUMB 2
def thumb2():
    """Diagonal split — DIRECT DECISION-MAKER CONTACTS."""
    img = Image.new("RGB", (W, H), LIGHT)
    d = ImageDraw.Draw(img)

    # dark navy diagonal panel on the right
    d.polygon([(640, 0), (W, 0), (W, H), (520, H)], fill=NAVY_DK)
    d = ImageDraw.Draw(img)

    # ---------------- LEFT
    x = 70
    d.rectangle([x, 108, x + 190, 146], fill=GOLD)
    text_c(d, (x + 95, 127), "FRONT DOOR", font(BLACK, 21), NAVY_DK)

    text_l(d, (x, 190), "DIRECT", font(BLACK, 74), NAVY_DK)
    text_l(d, (x, 276), "DECISION-MAKER", font(BLACK, 47), NAVY_DK)
    text_l(d, (x, 338), "CONTACTS", font(BLACK, 74), NAVY_DK)
    d.rectangle([x, 434, x + 290, 441], fill=GREEN)

    text_l(d, (x, 478), "Morocco · France · Gulf", font(BOLD, 25), TEXT)
    text_l(d, (x, 520), "Not the info@ inbox —", font(REG, 23), MUTED)
    text_l(d, (x, 550), "the actual person.", font(BOLD, 23), TEXT)

    # ---------------- RIGHT — contact card
    card = [690, 108, W - 56, 448]
    shadow_card(img, card, 18, WHITE)
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = card

    # avatar
    d.ellipse([x0 + 28, y0 + 28, x0 + 118, y0 + 118], fill=(225, 232, 238))
    d.ellipse([x0 + 54, y0 + 48, x0 + 92, y0 + 86], fill=NAVY)
    d.pieslice([x0 + 40, y0 + 80, x0 + 106, y0 + 146], 180, 360, fill=NAVY)

    text_l(d, (x0 + 140, y0 + 44), "Mehdi B.", font(BLACK, 34), TEXT)
    text_l(d, (x0 + 140, y0 + 88), "Directeur Général", font(REG, 23), MUTED)
    text_l(d, (x0 + 140, y0 + 122), "Logistics Group", font(REG, 20), MUTED)

    d.line([(x0 + 28, y0 + 162), (x1 - 28, y0 + 162)], fill=LINE, width=2)

    check(d, x0 + 28, y0 + 190, 30)
    text_l(d, (x0 + 70, y0 + 194), "EMAIL VERIFIED", font(BLACK, 22), GREEN)
    check(d, x0 + 28, y0 + 234, 30)
    text_l(d, (x0 + 70, y0 + 238), "DIRECT LINE", font(BLACK, 22), GREEN)
    check(d, x0 + 28, y0 + 278, 30)
    text_l(d, (x0 + 70, y0 + 282), "SOURCE CITED", font(BLACK, 22), GREEN)

    # price pill
    rounded(d, [690, 486, W - 56, 572], 14, fill=NAVY)
    text_l(d, (716, 502), "From $50", font(BLACK, 34), WHITE)
    text_l(d, (W - 226, 514), "per 50 contacts", font(REG, 21), (170, 200, 225))

    text_l(d, (690, 612), "Ready for Instantly · Apollo · Lemlist", font(REG, 21), (150, 185, 215))
    text_l(d, (690, 648), "Send me your niche — free 5-lead sample", font(BOLD, 21), GOLD)

    img.save(f"{OUT}/thumbnail-2-decisionmakers.png", "PNG", optimize=True)
    print("  thumb 2 OK  ->", f"{OUT}/thumbnail-2-decisionmakers.png")


# ================================================================ THUMB 3
def thumb3():
    """Before / after split — MESSY -> CLEAN (highest CTR pattern)."""
    img = Image.new("RGB", (W, H), LIGHT)
    d = ImageDraw.Draw(img)

    BAR = 66
    BODY = H - BAR
    d.rectangle([0, 0, W / 2, BODY], fill=PALE_R)
    d.rectangle([W / 2, 0, W, BODY], fill=PALE_G)
    d.line([(W / 2, 0), (W / 2, BODY)], fill=WHITE, width=6)

    # ---------------- LEFT header
    cross(d, 52, 40, 46)
    text_l(d, (118, 46), "MESSY", font(BLACK, 50), RED)

    # messy table
    tx0, ty0, tx1, ty1 = 52, 140, W / 2 - 52, 404
    rounded(d, [tx0, ty0, tx1, ty1], 12, fill=WHITE, outline=(240, 214, 207), width=2)
    d.rectangle([tx0, ty0, tx1, ty0 + 48], fill=(252, 233, 228))
    text_l(d, (tx0 + 18, ty0 + 12), "Company", font(BOLD, 17), MUTED)
    text_l(d, (tx0 + 250, ty0 + 12), "Email", font(BOLD, 17), MUTED)

    messy = [("ACME Corp", "info@acme..", True),
             ("acme corp", "INFO@acme..", True),
             ("Acme  Corp", "info@acme..", True),
             ("Beta SARL", "??", False),
             ("beta sarl", "contact@..", True),
             ("Gamma", "g@..", True)]
    ry = ty0 + 60
    for co, em, dup in messy:
        if dup:
            d.rectangle([tx0 + 8, ry - 3, tx1 - 8, ry + 26], fill=(253, 232, 227))
            d.rectangle([tx0 + 8, ry - 3, tx0 + 12, ry + 26], fill=RED)
        text_l(d, (tx0 + 18, ry), co, font(MONO, 16), RED if dup else TEXT)
        text_l(d, (tx0 + 250, ry), em, font(MONO, 16), RED if dup else TEXT)
        ry += 32

    text_l(d, (tx0, 440), "duplicates  ·  broken encodings", font(BOLD, 20), RED)
    text_l(d, (tx0, 474), "malformed phones  ·  4 date formats", font(REG, 19), MUTED)
    text_l(d, (tx0, 512), "1 file, 4 ways to spell one company", font(REG, 19), MUTED)

    # ---------------- RIGHT header
    rx = W / 2
    check(d, rx + 52, 40, 46)
    text_l(d, (rx + 118, 46), "CLEAN", font(BLACK, 50), GREEN)

    gx0, gy0, gx1, gy1 = rx + 52, 140, W - 52, 404
    rounded(d, [gx0, gy0, gx1, gy1], 12, fill=WHITE, outline=(206, 238, 224), width=2)
    d.rectangle([gx0, gy0, gx1, gy0 + 48], fill=(220, 245, 233))
    text_l(d, (gx0 + 18, gy0 + 12), "Company", font(BOLD, 17), MUTED)
    text_l(d, (gx0 + 230, gy0 + 12), "Email", font(BOLD, 17), MUTED)
    text_l(d, (gx0 + 452, gy0 + 12), "Status", font(BOLD, 17), MUTED)

    clean = [("Acme Corp", "info@acme..", True),
             ("Beta SARL", "contact@be..", True),
             ("Gamma", "g@gamma..", True),
             ("Delta", "d@delta..", True),
             ("Epsilon", "e@eps..", True),
             ("Zeta", "z@zeta..", True)]
    ry = gy0 + 60
    for co, em, ok in clean:
        text_l(d, (gx0 + 18, ry), co, font(MONO, 16), TEXT)
        text_l(d, (gx0 + 230, ry), em, font(MONO, 16), TEXT)
        check(d, gx0 + 452, ry - 2, 22)
        ry += 32

    text_l(d, (gx0, 440), "0 duplicates  ·  E.164 phones", font(BOLD, 20), GREEN)
    text_l(d, (gx0, 474), "ISO dates  ·  every fix in a report", font(REG, 19), MUTED)
    text_l(d, (gx0, 512), "1 row per real company, always", font(REG, 19), MUTED)

    # arrow
    ax = W / 2
    d.ellipse([ax - 40, 290, ax + 40, 370], fill=WHITE)
    d.ellipse([ax - 40, 290, ax + 40, 370], outline=TEXT, width=4)
    d.line([(ax - 14, 330), (ax + 8, 330)], fill=TEXT, width=6)
    d.line([(ax - 2, 316), (ax + 14, 330)], fill=TEXT, width=6)
    d.line([(ax - 2, 344), (ax + 14, 330)], fill=TEXT, width=6)

    # ---------------- BOTTOM BAR
    d.rectangle([0, BODY, W, H], fill=TEXT)
    text_c(d, (W / 2, BODY + 33), "Arabic  ·  French  ·  English        |        written report of every fix",
           font(BOLD, 25), WHITE)

    img.save(f"{OUT}/thumbnail-3-datacleaning.png", "PNG", optimize=True)
    print("  thumb 3 OK  ->", f"{OUT}/thumbnail-3-datacleaning.png")


if __name__ == "__main__":
    print("Building 3 Fiverr thumbnails (1280x769)...")
    thumb1()
    thumb2()
    thumb3()
    print("Done ->", OUT)
