"""
io_utils.py
===========
De-duplication + CSV / XLSX export shared by the two scraper variants.
"""

from __future__ import annotations

import os
import re
import sys
import time


def dedupe(listings: list[dict]) -> tuple[list[dict], int]:
    """Remove duplicates (same place name + city, or same phone number).

    Returns (clean_list, duplicates_removed).
    """
    seen_keys: set[tuple] = set()
    clean: list[dict] = []
    for row in listings:
        key_name = re.sub(r"\W+", "", f"{row.get('name', '')}{row.get('city', '')}".lower())
        key_phone = re.sub(r"\D", "", row.get("phone", "") or "")
        key = (key_name, key_phone)
        if key in seen_keys:
            continue
        seen_keys.add(key)
        clean.append(row)
    return clean, len(listings) - len(clean)


def save_outputs(listings: list[dict], out_dir: str, base_name: str) -> dict:
    """Write `<base_name>.csv` and `<base_name>.xlsx`; returns the file paths."""
    import pandas as pd

    from listing_parser import COLUMNS

    os.makedirs(out_dir, exist_ok=True)
    df = pd.DataFrame(listings)
    for col in COLUMNS:                      # guarantee a stable column order
        if col not in df.columns:
            df[col] = ""
    df = df[COLUMNS]

    csv_path = os.path.join(out_dir, f"{base_name}.csv")
    xlsx_path = os.path.join(out_dir, f"{base_name}.xlsx")
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")  # BOM => opens fine in Excel

    with pd.ExcelWriter(xlsx_path, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="listings")
        _autosize(writer.sheets["listings"], df)
        _freeze_and_filter(writer.sheets["listings"], df)

    return {"csv": csv_path, "xlsx": xlsx_path, "rows": len(df)}


def _autosize(ws, df) -> None:
    for i, col in enumerate(df.columns, start=1):
        width = max([len(str(col))] + [len(str(v)) for v in df[col].tolist()])
        ws.column_dimensions[ws.cell(row=1, column=i).column_letter].width = min(width + 2, 60)
    from copy import copy
    for cell in ws[1]:                      # bold header
        font = copy(cell.font)
        font.bold = True
        cell.font = font


def _freeze_and_filter(ws, df) -> None:
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions


def log(msg: str) -> None:
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def die(msg: str, code: int = 1) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)
