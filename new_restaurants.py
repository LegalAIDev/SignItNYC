"""
Find recently opened restaurants in NYC/Brooklyn using the DOHMH
Restaurant Inspections dataset on NYC Open Data (dataset ID: 43nn-pn8j).

A restaurant is considered "new" when its earliest recorded inspection
is within the lookback window. Each CAMIS (unique establishment ID)
appears multiple times in the dataset (once per inspection); we take
the minimum inspection_date per CAMIS to find first-ever inspections.

Docs: https://dev.socrata.com/foundry/data.cityofnewyork.us/43nn-pn8j
"""

import csv
import os
import re
from datetime import datetime, timedelta

import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DATASET_ID = "43nn-pn8j"
BASE_URL = f"https://data.cityofnewyork.us/resource/{DATASET_ID}.json"

# Optional: set an app token to avoid rate limiting (register free at
# https://data.cityofnewyork.us/profile/app_tokens)
APP_TOKEN = os.getenv("NYC_OPEN_DATA_TOKEN", "")

# How far back to look for first inspections
LOOKBACK_DAYS = 90

# Boroughs to include — DOHMH uses all-caps names
BOROUGHS = {"BROOKLYN", "MANHATTAN"}

# Page size for API calls
PAGE_SIZE = 1000

# Output CSV path
CSV_OUTPUT = "new_restaurants.csv"

# Known chain/franchise brand keywords (case-insensitive, matched against DBA)
CHAIN_KEYWORDS = {
    "mcdonald", "burger king", "wendy's", "wendys", "taco bell", "chipotle",
    "subway", "dunkin", "starbucks", "domino", "pizza hut", "little caesars",
    "kfc", "popeyes", "chick-fil-a", "five guys", "shake shack", "wingstop",
    "sweetgreen", "pret a manger", "pret ", "panera", "chop't", "chopt",
    "cosi ", "au bon pain", "just salad", "dig inn", "dig ", "two boots",
    "papa john", "papa john's", "checkers", "rally's", "sonic ", "arby's",
    "arbys", "dairy queen", "baskin", "häagen-dazs", "haagen-dazs",
    "carvel", "cinnabon", "auntie anne", "sbarro", "nathan's", "nathans",
    "white castle", "waffle house", "ihop", "denny's", "dennys",
    "applebee's", "applebees", "olive garden", "red lobster", "outback",
    "cheesecake factory", "buffalo wild wings", "hooters", "friendly's",
    "friendlys", "chuck e cheese", "moe's", "moes ", "qdoba",
    "jersey mike", "jimmy john", "quiznos", "blaze pizza", "mod pizza",
    "halal guys", "the halal guys", "playa bowls", "jamba", "smoothie king",
    "ralph's", "ralphs famous", "lady m", "magnolia bakery",
}


# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------

def get_headers() -> dict:
    return {"X-App-Token": APP_TOKEN} if APP_TOKEN else {}


def fetch_new_camis(since: str) -> dict[str, str]:
    """
    Query the full dataset for every CAMIS whose all-time earliest inspection
    is on or after `since`. Uses a server-side GROUP BY + HAVING so we never
    misidentify an established restaurant as new.

    Returns {camis: first_inspection_date_str}.
    """
    print("  querying all-time first inspections per establishment...")
    results, offset = {}, 0
    while True:
        params = {
            "$select": "camis, min(inspection_date) as first_ever",
            "$group": "camis",
            "$having": f"min(inspection_date) >= '{since}'",
            "$limit": PAGE_SIZE,
            "$offset": offset,
        }
        resp = requests.get(BASE_URL, params=params, headers=get_headers(), timeout=120)
        resp.raise_for_status()
        page = resp.json()
        if not page:
            break
        for row in page:
            results[row["camis"]] = row["first_ever"][:10]
        print(f"  found {len(results):,} genuinely new CAMISes so far...")
        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return results


def fetch_details(camis_set: set[str]) -> list[dict]:
    """
    For a set of CAMISes, fetch one representative detail row each.
    Batches into chunks to stay within URL length limits.
    Borough filtering happens in Python after fetch.
    """
    print("  fetching establishment details...")
    camis_list = list(camis_set)
    chunk_size = 200
    rows = {}

    for i in range(0, len(camis_list), chunk_size):
        chunk = camis_list[i : i + chunk_size]
        quoted = ", ".join(f"'{c}'" for c in chunk)
        params = {
            "$select": "camis,dba,boro,building,street,zipcode,cuisine_description,phone",
            "$where": f"camis in({quoted})",
            "$limit": chunk_size * 5,
        }
        resp = requests.get(BASE_URL, params=params, headers=get_headers(), timeout=120)
        resp.raise_for_status()
        for row in resp.json():
            camis = row.get("camis")
            if camis and camis not in rows:
                rows[camis] = row

    return list(rows.values())


# ---------------------------------------------------------------------------
# Process
# ---------------------------------------------------------------------------

def find_new_establishments(since: str, boroughs: set[str]) -> list[dict]:
    """
    Return one detail row per establishment that is genuinely new:
    its all-time first DOHMH inspection is on or after `since`,
    and it is in one of the target boroughs.
    """
    new_camis = fetch_new_camis(since)
    if not new_camis:
        return []

    details = fetch_details(set(new_camis.keys()))

    # boroughs set is uppercase; data uses title case — normalise for comparison
    boroughs_upper = {b.upper() for b in boroughs}

    result = []
    for row in details:
        camis = row.get("camis")
        boro = row.get("boro", "").upper()
        if boro not in boroughs_upper or camis not in new_camis:
            continue
        try:
            first_date = datetime.fromisoformat(new_camis[camis])
        except ValueError:
            continue
        result.append({**row, "_date": first_date})

    result.sort(key=lambda r: r["_date"], reverse=True)
    return result


def is_chain(name: str) -> bool:
    """Return True if the name matches a known chain or has a franchise number (e.g. 'BURGER KING #4521')."""
    lower = name.lower()
    if re.search(r"#\s*\d+", lower):
        return True
    return any(kw in lower for kw in CHAIN_KEYWORDS)


def format_address(row: dict) -> str:
    parts = [row.get("building", ""), row.get("street", ""), row.get("boro", ""), row.get("zipcode", "")]
    return " ".join(p for p in parts if p).title()


def export_csv(rows: list[dict], path: str) -> None:
    fields = ["first_inspection", "name", "cuisine", "borough", "building", "street", "zipcode", "phone", "camis"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for r in rows:
            writer.writerow({
                "first_inspection": r["_date"].strftime("%Y-%m-%d"),
                "name": r.get("dba", ""),
                "cuisine": r.get("cuisine_description", ""),
                "borough": r.get("boro", "").title(),
                "building": r.get("building", ""),
                "street": r.get("street", "").title(),
                "zipcode": r.get("zipcode", ""),
                "phone": r.get("phone", ""),
                "camis": r.get("camis", ""),
            })


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    lookback = LOOKBACK_DAYS
    since = (datetime.now() - timedelta(days=lookback)).strftime("%Y-%m-%dT00:00:00")

    print(f"\nSearching for new restaurants in {BOROUGHS}")
    print(f"Lookback: {lookback} days (since {since[:10]})\n")

    new = find_new_establishments(since, BOROUGHS)
    print(f"\nTotal inspection records fetched: {len(new):,}")
    print(f"New establishments (first inspection within window): {len(new)}\n")

    export_csv(new, CSV_OUTPUT)
    print(f"Exported to {CSV_OUTPUT}\n")

    print(f"{'First Inspection':<18} {'Name':<40} {'Cuisine':<25} {'Borough':<12} {'Address'}")
    print("-" * 130)
    for r in new:
        date_str = r["_date"].strftime("%Y-%m-%d")
        name = r.get("dba", "")[:38]
        cuisine = r.get("cuisine_description", "")[:23]
        boro = r.get("boro", "").title()[:10]
        address = f"{r.get('building','')} {r.get('street','').title()}".strip()[:35]
        print(f"{date_str:<18} {name:<40} {cuisine:<25} {boro:<12} {address}")


if __name__ == "__main__":
    main()
