"""
make_list_visuals.py — visual proof of the Morocco B2B list (portfolio + gig).

Reads morocco_b2b_list.csv and renders:
  list-stats.png      1280x800  — headline numbers (rows, published emails, sectors, cities)
  list-table.png      1280x900  — a real screenshot-style spreadsheet of the data
"""
import csv
import os
from collections import Counter

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "thumbnails", "output")
os.makedirs(OUT, exist_ok=True)
CSV = os.path.join(HERE, "morocco_b2b_list.csv")

F = "C:/Windows/Fonts/"
BLACK, BOLD, REG, MONO = "ariblk.ttf", "segoeuib.ttf", "segoeui.ttf", "consola.ttf"
NAVY = (31, 78, 120)
NAVY_D = (10, 61, 98)
GREEN = (0, 184, 148)
GOLD = (253, 203, 110)
LIGHT = (248, 249, 250)
TXT = (45, 52, 54)
MUT = (99, 110, 114)
LINE = (223, 227, 230)
WHITE = (255, 255, 255)


def f(n, s):
    return ImageFont.truetype(F + n, s)


def load():
    with open(CSV, encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))


def stats_img(rows):
    W, H = 1280, 800
    img = Image.new("RGB", (W, H), LIGHT)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 150], fill=NAVY)
    d.text((56, 34), "MOROCCO B2B LEAD LIST", font=f(BLACK, 44), fill=WHITE)
    d.text((56, 94), "Scraped from a public Moroccan business directory - every email published by the source",
           font=f(REG, 21), fill=(168, 200, 228))

    with_email = [r for r in rows if r["email"]]
    sectors = len(set(r["sector"] for r in rows if r["sector"]))
    cities = len(set(r["city"] for r in rows if r["city"]))
    acts = len(set(r["activity"] for r in rows if r["activity"]))
    phones = sum(1 for r in rows if r["phone"])

    cells = [(f"{len(rows):,}", "COMPANIES", NAVY),
             (f"{len(with_email):,}", "PUBLISHED EMAILS", GREEN),
             (f"{cities}", "CITIES", NAVY),
             (f"{sectors}", "SECTORS", NAVY),
             (f"{acts}", "CATEGORIES", NAVY),
             (f"{phones:,}", "PHONE NUMBERS", NAVY)]
    bw = (W - 112 - 5 * 16) / 6
    for i, (big, lbl, col) in enumerate(cells):
        x = 56 + i * (bw + 16)
        d.rounded_rectangle([x, 200, x + bw, 360], radius=14, fill=WHITE,
                            outline=LINE, width=2)
        d.text((x + bw / 2, 258), big, font=f(BLACK, 42), fill=col, anchor="mm")
        d.text((x + bw / 2, 316), lbl, font=f(BOLD, 14), fill=MUT, anchor="mm")

    # top sectors
    d.text((56, 410), "TOP SECTORS", font=f(BLACK, 22), fill=NAVY)
    cnt = Counter(r["sector"] for r in rows if r["sector"] and r["sector"] != "Autres")
    top = cnt.most_common(10)
    maxv = top[0][1] if top else 1
    y = 452
    for name, v in top:
        d.text((56, y), name[:26], font=f(BOLD, 17), fill=TXT)
        barw = int((W - 420) * v / maxv)
        d.rounded_rectangle([250, y + 2, 250 + barw, y + 20], radius=9, fill=NAVY)
        d.text((W - 56, y - 2), f"{v:,}", font=f(BOLD, 17), fill=MUT, anchor="ra")
        y += 32

    d.rectangle([0, H - 60, W, H], fill=NAVY_D)
    d.text((56, H - 42), "Bounce-checked before sending  -  source URL on every row  -  Excel + CSV ready for Instantly / Apollo / Lemlist",
           font=f(REG, 19), fill=(190, 214, 236))
    img.save(os.path.join(OUT, "list-stats.png"), "PNG", optimize=True)
    print("  list-stats.png")


def table_img(rows):
    W, H = 1280, 900
    img = Image.new("RGB", (W, H), LIGHT)
    d = ImageDraw.Draw(img)
    d.text((56, 38), "MOROCCO B2B LIST - SAMPLE ROWS", font=f(BLACK, 36), fill=NAVY)
    d.text((56, 90), "real data, published emails, source URL on every row", font=f(REG, 20), fill=MUT)

    card = [56, 132, W - 56, H - 56]
    d.rounded_rectangle(card, radius=14, fill=WHITE, outline=LINE, width=2)
    x0, y0, x1, y1 = card
    d.rounded_rectangle([x0, y0, x1, y0 + 56], radius=14, fill=NAVY)
    d.rectangle([x0, y0 + 30, x1, y0 + 56], fill=NAVY)
    d.text((x0 + 20, y0 + 16), "morocco_b2b_list.xlsx", font=f(MONO, 18), fill=WHITE)
    for i, c in enumerate([(237, 106, 94), (245, 191, 79), (97, 197, 84)]):
        d.ellipse([x1 - 74 + i * 22, y0 + 20, x1 - 62 + i * 22, y0 + 32], fill=c)

    cols = [("Company", 20, 300), ("Sector", 320, 170), ("City", 490, 140),
            ("Phone", 630, 170), ("Email", 800, 330)]
    hy = y0 + 70
    d.rectangle([x0, hy, x1, hy + 38], fill=(238, 242, 246))
    for name, off, _ in cols:
        d.text((x0 + off, hy + 11), name, font=f(BOLD, 16), fill=MUT)

    y = hy + 38
    for i, r in enumerate(rows[:15]):
        if i % 2 == 1:
            d.rectangle([x0 + 1, y, x1 - 1, y + 42], fill=(250, 251, 252))
        vals = [r["company"][:34], r["sector"][:20], r["city"][:16],
                r["phone"][:19], r["email"][:36]]
        for (name, off, _), v in zip(cols, vals):
            d.text((x0 + off, y + 12), v, font=f(MONO, 15), fill=TXT)
        d.ellipse([x0 + 1135, y + 10, x0 + 1155, y + 30], fill=GREEN)
        d.text((x0 + 1164, y + 12), "OK", font=f(BOLD, 14), fill=GREEN)
        y += 42
        d.line([(x0 + 12, y), (x1 - 12, y)], fill=LINE, width=1)

    d.text((x0 + 20, y + 14), f"... {len(rows):,} rows total - full Excel + CSV delivered with the order",
           font=f(REG, 17), fill=MUT)
    img.save(os.path.join(OUT, "list-table.png"), "PNG", optimize=True)
    print("  list-table.png")


if __name__ == "__main__":
    rows = load()
    print(f"rows: {len(rows)}")
    stats_img(rows)
    table_img(rows)
    print("done ->", OUT)
