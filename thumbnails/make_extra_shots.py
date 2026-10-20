"""
make_extra_shots.py — 3 extra portfolio images per project (code / terminal / output).

Fiverr portfolio attachments accept IMAGES ONLY (.jpg .png .gif .mp4 .avi),
max 5 files, and the FIRST file becomes the thumbnail. So every project's
attachments have to be pictures, not the .py/.xlsx/.csv source files.

Run: python thumbnails/make_extra_shots.py
"""
import csv, os, re, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEMOS = os.path.join(BASE, "portfolio-demos")
OUT = os.path.join(BASE, "thumbnails", "output")
os.makedirs(OUT, exist_ok=True)

W, H = 1280, 720

# editor / terminal palette
ED_BG   = (24, 28, 36)
ED_BAR  = (36, 41, 51)
ED_GUT  = (44, 50, 61)
ED_NUM  = (88, 96, 110)
ED_TXT  = (206, 212, 222)
ED_KEY  = (197, 134, 192)
ED_STR  = (152, 195, 121)
ED_NUMB = (229, 192, 123)
ED_COM  = (106, 115, 130)
ED_FN   = (86, 156, 214)
ED_FNC  = (220, 220, 170)

NAVY   = (31, 78, 120)
GREEN  = (0, 184, 148)
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
    d.line([(x + s*.26, y + s*.52), (x + s*.44, y + s*.70), (x + s*.76, y*.30 + s*.30)],
           fill=WHITE, width=max(2, s // 8), joint="curve")


def shadow(img, box, r, fill):
    from PIL import ImageFilter
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    x0, y0, x1, y1 = box
    od.rounded_rectangle([x0, y0 + 7, x1, y1 + 7], radius=r, fill=(0, 0, 0, 30))
    ov = ov.filter(ImageFilter.GaussianBlur(9))
    img.paste(Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB"), (0, 0))
    ImageDraw.Draw(img).rounded_rectangle(box, radius=r, fill=fill)


# ------------------------------------------------------------------ code shot
KEYWORDS = {"def", "class", "return", "if", "elif", "else", "for", "while", "in", "not",
            "and", "or", "None", "True", "False", "import", "from", "as", "with",
            "try", "except", "finally", "raise", "yield", "lambda", "pass", "break",
            "continue", "global", "assert", "del", "is", "await", "async"}
BUILTINS = {"print", "len", "open", "range", "str", "int", "float", "list", "dict",
            "set", "tuple", "bool", "isinstance", "getattr", "super", "type"}


def tokenize(line):
    """-> list of (text, color)"""
    out = []
    i = 0
    n = len(line)
    while i < n:
        ch = line[i]
        if ch == "#":
            out.append((line[i:], ED_COM)); break
        if ch in "\"'":
            q = ch; j = i + 1
            while j < n and line[j] != q:
                if line[j] == "\\": j += 1
                j += 1
            j = min(j + 1, n)
            out.append((line[i:j], ED_STR)); i = j; continue
        if ch.isalpha() or ch == "_":
            j = i
            while j < n and (line[j].isalnum() or line[j] == "_"): j += 1
            w = line[i:j]
            if w in KEYWORDS: out.append((w, ED_KEY))
            elif w in BUILTINS: out.append((w, ED_FNC))
            else: out.append((w, ED_TXT))
            i = j; continue
        if ch.isdigit():
            j = i
            while j < n and (line[j].isdigit() or line[j] in "._"): j += 1
            out.append((line[i:j], ED_NUMB)); i = j; continue
        out.append((ch, ED_TXT)); i += 1
    return out


def code_shot(out_name, title, file_path, subtitle, start=0, lines=28):
    img = Image.new("RGB", (W, H), ED_BG)
    d = ImageDraw.Draw(img)

    d.rectangle([0, 0, W, 44], fill=ED_BAR)
    d.rectangle([0, 44, 52, H], fill=ED_BAR)          # gutter first, so nothing hides under it
    d.text((24, 13), title, font=font(MONOB, 17), fill=WHITE, anchor="la")
    for i, c in enumerate([(237, 106, 94), (245, 191, 79), (97, 197, 84)]):
        d.ellipse([W - 92 + i * 22, 16, W - 80 + i * 22, 28], fill=c)
    d.text((68, 56), subtitle, font=font(REG, 17), fill=(140, 150, 165), anchor="la")

    with open(file_path, encoding="utf-8", errors="replace") as f:
        src = f.read().splitlines()

    y = 96
    fm = font(MONO, 15)
    for idx, line in enumerate(src[start:start + lines], start=start + 1):
        if y > H - 26: break
        d.rectangle([0, y - 3, 52, y + 20], fill=ED_BAR)
        d.text((40, y), str(idx), font=font(MONO, 14), fill=ED_NUM, anchor="ra")
        x = 66
        for txt, col in tokenize(line):
            d.text((x, y), txt, font=fm, fill=col, anchor="la")
            x += d.textlength(txt, font=fm)
        y += 24

    img.save(os.path.join(OUT, out_name), "PNG", optimize=True)
    print("  " + out_name)


# --------------------------------------------------------------- terminal shot
def term_shot(out_name, title, lines, subtitle=""):
    img = Image.new("RGB", (W, H), (16, 18, 22))
    d = ImageDraw.Draw(img)

    d.rectangle([0, 0, W, 40], fill=(32, 35, 40))
    for i, c in enumerate([(237, 106, 94), (245, 191, 79), (97, 197, 84)]):
        d.ellipse([24 + i * 22, 15, 36 + i * 22, 27], fill=c)
    d.text((110, 12), title, font=font(MONOB, 16), fill=(200, 205, 212), anchor="la")
    if subtitle:
        d.text((24, 54), subtitle, font=font(REG, 17), fill=(150, 158, 170), anchor="la")

    y = 86 if subtitle else 66
    fm = font(MONO, 16)
    for ln in lines:
        if y > H - 24: break
        col = (214, 220, 228)
        if ln.startswith("$"): col = (126, 214, 160)
        elif "->" in ln or ":" in ln: col = (170, 180, 196)
        d.text((30, y), ln, font=fm, fill=col, anchor="la")
        y += 26

    img.save(os.path.join(OUT, out_name), "PNG", optimize=True)
    print("  " + out_name)


# ---------------------------------------------------------------- output shot
def table_shot(out_name, title, subtitle, headers, rows, chips, widths):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.text((52, 38), title, font=font(BLACK, 32), fill=NAVY)
    d.text((52, 82), subtitle, font=font(REG, 19), fill=MUTED)

    card = [52, 122, W - 52, H - 62]
    shadow(img, card, 14, WHITE)
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = card
    d.rounded_rectangle([x0, y0, x1, y0 + 56], radius=14, fill=NAVY)
    d.rectangle([x0, y0 + 34, x1, y0 + 56], fill=NAVY)
    d.text((x0 + 20, y0 + 17), os.path.basename(title), font=font(MONOB, 18), fill=WHITE, anchor="la")
    for i, c in enumerate([(237, 106, 94), (245, 191, 79), (97, 197, 84)]):
        d.ellipse([x1 - 74 + i * 22, y0 + 22, x1 - 62 + i * 22, y0 + 34], fill=c)

    hy = y0 + 70
    d.rectangle([x0, hy, x1, hy + 36], fill=(240, 243, 246))
    off = 18
    for h, w in zip(headers, widths):
        d.text((x0 + off, hy + 9), h, font=font(BOLD, 15), fill=MUTED, anchor="la")
        off += w
    ry = hy + 36
    for i, r in enumerate(rows):
        if i % 2 == 1:
            d.rectangle([x0 + 1, ry, x1 - 1, ry + 40], fill=(250, 251, 252))
        off = 18
        for j, (v, w) in enumerate(zip(r, widths)):
            if isinstance(v, bool):
                check(d, x0 + off, ry + 6, 22)
            else:
                d.text((x0 + off, ry + 12), str(v)[:int(w / 9)], font=font(MONO, 15), fill=TEXT, anchor="la")
            off += w
        ry += 40
        d.line([(x0 + 12, ry), (x1 - 12, ry)], fill=LINE, width=1)

    fx = 52
    for t in chips:
        w = d.textlength(t, font=font(BOLD, 15)) + 26
        d.rounded_rectangle([fx, H - 48, fx + w, H - 14], radius=17, fill=NAVY)
        d.text((fx + 13, H - 41), t, font=font(BOLD, 15), fill=WHITE, anchor="la")
        fx += w + 10

    img.save(os.path.join(OUT, out_name), "PNG", optimize=True)
    print("  " + out_name)


# ================================================================== build all
if __name__ == "__main__":
    print("Building extra portfolio shots...")

    # ---------------------------------------------------------- PROJECT 1
    code_shot("portfolio-1-code.png", "scraper_playwright.py",
              os.path.join(DEMOS, "google-maps-scraper", "scraper_playwright.py"),
              "Playwright variant: query -> scroll -> open each listing -> parse -> dedupe -> export")
    term_shot("portfolio-1-terminal.png", "Windows Terminal — scraper_dom.py", [
        "PS C:\\portfolio-demos\\google-maps-scraper> python scraper_dom.py --html sample_page.html --out demo_output --name sample_output",
        "",
        "[00:45:14] Extracted 11 listings -> 1 duplicate(s) removed.",
        "[00:45:14] CSV : demo_output\\sample_output.csv",
        "[00:45:14] XLSX: demo_output\\sample_output.xlsx",
        "",
        "PS C:\\portfolio-demos\\google-maps-scraper>",
    ], "Same command, no browser and no API key — fully offline and reproducible")
    with open(os.path.join(DEMOS, "google-maps-scraper", "demo_output", "sample_output.csv"),
              encoding="utf-8-sig", newline="") as f:
        r1 = list(csv.DictReader(f))
    table_shot("portfolio-1-output.png", "sample_output.csv",
               "10 unique rows, 1 duplicate removed — every row keeps its source URL",
               ["Name", "Category", "City", "Phone", "Rating", "Website"],
               [[r["name"], r["category"], r["city"], r["phone"], r["rating"], r["website"]] for r in r1[:9]],
               ["CSV", "XLSX", "dedupe", "source URL", "no API key"],
               [250, 210, 120, 200, 80, 260])

    # ---------------------------------------------------------- PROJECT 2
    code_shot("portfolio-2-code.png", "clean_data.py",
              os.path.join(DEMOS, "excel-data-cleaner", "clean_data.py"),
              "9-step pipeline: normalise -> fuzzy dedupe -> e-mail repair -> phone E.164 -> dates ISO -> report")
    term_shot("portfolio-2-terminal.png", "Windows Terminal — clean_data.py", [
        "PS C:\\portfolio-demos\\excel-data-cleaner> python generate_messy.py",
        "  wrote demo_output\\messy_sample.xlsx  (200 rows, seeded)",
        "",
        "PS C:\\portfolio-demos\\excel-data-cleaner> python clean_data.py",
        "Rows in : 200",
        "Rows out: 140  (60 duplicates removed, 6 kept for review)",
        "XLSX    : demo_output\\cleaned_output.xlsx",
        "Report  : demo_output\\changes_report.md",
        "",
        "PS C:\\portfolio-demos\\excel-data-cleaner>",
    ], "Same input every run — the seed is fixed, so the result can be verified")
    table_shot("portfolio-2-output.png", "changes_report.md",
               "200 rows in, 140 out — 60 duplicates removed, 120 e-mails repaired, 11 encodings fixed",
               ["Metric", "Before", "After", "Status"],
               [["Rows", "200", "140", True], ["Duplicates", "60", "0", True],
                ["E-mails repaired", "0", "120", True], ["Unrepairable e-mails", "-", "12 flagged", False],
                ["Phones to E.164", "0", "175", True], ["Dates to ISO 8601", "0", "199", True],
                ["Encodings fixed", "0", "11", True]],
               ["pandas", "openpyxl", "written report", "E.164", "ISO 8601"],
               [260, 200, 200, 160])

    # ---------------------------------------------------------- PROJECT 3
    code_shot("portfolio-3-code.png", "build_leads.py",
              os.path.join(DEMOS, "lead-list-builder", "build_leads.py"),
              "Company list -> enriched lead list, deterministic output, mock rows always flagged")
    term_shot("portfolio-3-terminal.png", "Windows Terminal — build_leads.py", [
        "PS C:\\portfolio-demos\\lead-list-builder> python build_leads.py",
        "",
        "Leads   : 16 (16 companies)",
        "Mode    : mock (fake data, clearly flagged in `enrichment_status`)",
        "Output  : demo_output\\lead_list.xlsx",
        "Output  : demo_output\\lead_list.csv",
        "",
        "PS C:\\portfolio-demos\\lead-list-builder>",
    ], "Two consecutive runs produce byte-identical output")
    with open(os.path.join(DEMOS, "lead-list-builder", "demo_output", "lead_list.csv"),
              encoding="utf-8-sig", newline="") as f:
        r3 = list(csv.DictReader(f))
    table_shot("portfolio-3-output.png", "lead_list.csv",
               "16 leads in Instantly / Apollo / Lemlist import format",
               ["Full name", "Title", "Company", "Work email", "City"],
               [[r["full_name"], r["title"], r["company"], r["work_email"], r["city"]] for r in r3[:9]],
               ["Instantly", "Apollo", "Lemlist", "CSV", "XLSX"],
               [220, 230, 220, 330, 140])

    print("Done ->", OUT)
