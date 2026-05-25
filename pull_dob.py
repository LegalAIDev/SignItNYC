"""
Pull NYC DOB A1/A2 permits for eating & drinking establishments.
Outputs data-permits.jsx — drop it in the project folder and reload the page.

Data source: NYC Open Data — DOB Permit Issuance
Dataset: https://data.cityofnewyork.us/resource/ipu4-2q9a.json
Docs:    https://dev.socrata.com/foundry/data.cityofnewyork.us/ipu4-2q9a

Usage:
    python pull_dob.py                  # last 30 days, all 5 boroughs
    python pull_dob.py --days 14        # tighter window
    python pull_dob.py --borough MN BK  # Manhattan + Brooklyn only

Optional env var:
    NYC_OPEN_DATA_TOKEN=<your-app-token>   # avoids rate limiting; free at
                                           # https://data.cityofnewyork.us/profile/app_tokens
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timedelta

import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DATASET_URL  = "https://data.cityofnewyork.us/resource/ipu4-2q9a.json"
# TODO: set NYC_OPEN_DATA_TOKEN env var for production (see .env.example)
APP_TOKEN    = os.getenv("NYC_OPEN_DATA_TOKEN", "")
PAGE_SIZE    = 1000
OUTPUT_FILE  = "data-permits.jsx"

# DOB borough codes → display names
BOROUGH_MAP = {
    "MN": "Manhattan",
    "BK": "Brooklyn",
    "QN": "Queens",
    "BX": "Bronx",
    "SI": "Staten Island",
}

# Use group codes that cover eating & drinking (Use Group 6 / 12 / assembly F-1).
# The DOB permit dataset stores this in `occupancy_classification`.
# Common values: 'F-1 ASSEMBLY', 'U6', 'MU', etc.  We match loosely.
EATING_KEYWORDS = {"eating", "drinking", "restaurant", "f-1", "assembly", "u6", "u-6"}


# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------

def headers() -> dict:
    return {"X-App-Token": APP_TOKEN} if APP_TOKEN else {}


def fetch_permits(since_date: str, borough_codes: list[str]) -> list[dict]:
    """
    Pull A1/A2 permits filed on or after since_date.
    Filters by job_type and filing_date; borough filter applied in Python
    because the API borough field uses full names ('MANHATTAN' etc).
    """
    print(f"  querying DOB permits since {since_date} …")
    rows, offset = [], 0
    while True:
        params = {
            "$where": (
                f"job_type IN('A1','A2') "
                f"AND filing_date >= '{since_date}T00:00:00'"
            ),
            "$select": (
                "job__,job_type,filing_date,job_status,"
                "house_no,street_name,borough,zip_code,"
                "owner_s_business_name,applicant_s_first_name,applicant_s_last_name,"
                "applicant_business_name,applicant_license_no,applicant_phone,"
                "occupancy_classification,estimated_job_costs,total_construction_floor_area"
            ),
            "$limit":  PAGE_SIZE,
            "$offset": offset,
            "$order":  "filing_date DESC",
        }
        resp = requests.get(DATASET_URL, params=params, headers=headers(), timeout=60)
        resp.raise_for_status()
        page = resp.json()
        if not page:
            break
        rows.extend(page)
        print(f"    {len(rows):,} permits fetched …")
        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE

    # Filter boroughs
    target_names = {BOROUGH_MAP[c].upper() for c in borough_codes if c in BOROUGH_MAP}
    if target_names:
        rows = [r for r in rows if r.get("borough", "").upper() in target_names]

    # Filter eating & drinking by occupancy_classification
    def is_eating(r):
        occ = r.get("occupancy_classification", "").lower()
        return any(kw in occ for kw in EATING_KEYWORDS)

    rows = [r for r in rows if is_eating(r)]
    return rows


# ---------------------------------------------------------------------------
# Transform
# ---------------------------------------------------------------------------

CLEAN_RE = re.compile(r"[^\w\s\-&.,']")


def clean(s: str) -> str:
    return CLEAN_RE.sub("", (s or "").strip()).title()


def addr(r: dict) -> str:
    return f"{r.get('house_no','')} {clean(r.get('street_name',''))}".strip()


def permit_to_js(r: dict, filed_date: datetime) -> dict:
    days_ago = (datetime.now() - filed_date).days
    arch_name = " ".join(filter(None, [
        r.get("applicant_s_first_name", ""),
        r.get("applicant_s_last_name", ""),
    ])).title() or r.get("applicant_business_name", "")

    raw_sqft = r.get("total_construction_floor_area", "")
    sqft = int(float(raw_sqft)) if raw_sqft else 0

    raw_cost = r.get("estimated_job_costs", "")
    est_cost = ""
    if raw_cost:
        try:
            c = float(raw_cost)
            est_cost = f"${c/1000:.1f}k" if c < 1_000_000 else f"${c/1_000_000:.1f}M"
        except ValueError:
            pass

    return {
        "id":      r.get("job__", "").strip(),
        "biz":     clean(r.get("owner_s_business_name", "")),
        "llc":     clean(r.get("owner_s_business_name", "")),
        "addr":    addr(r),
        "boro":    r.get("borough", "").title(),
        "job":     r.get("job_type", ""),
        "filed":   days_ago,
        "filedOn": filed_date.strftime("%Y-%m-%d"),
        "archName": arch_name,
        "archLicense": r.get("applicant_license_no", ""),
        "archPhone": r.get("applicant_phone", ""),
        "sla":     "none",
        "site":    "unchecked",
        "score":   0,
        "stage":   "new",
        "sqft":    sqft,
        "est":     est_cost,
    }


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

JS_HEADER = """\
// AUTO-GENERATED by pull_dob.py — do not edit by hand.
// Generated: {ts}
// Window: {days} days · Boroughs: {boros} · {count} permits
//
// To refresh: python pull_dob.py && reload browser

(function () {{
  const PERMITS = {permits_json};

  if (window.VESTIBULE_DATA) {{
    window.VESTIBULE_DATA.PERMITS = PERMITS;
    window.VESTIBULE_DATA._dobPulledAt = '{ts}';
  }}
}})();
"""


def write_jsx(permits: list[dict], days: int, boros: list[str], path: str) -> None:
    ts    = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    boros_str = ", ".join(BOROUGH_MAP.get(b, b) for b in boros)
    js    = JS_HEADER.format(
        ts=ts,
        days=days,
        boros=boros_str,
        count=len(permits),
        permits_json=json.dumps(permits, indent=2, ensure_ascii=False),
    )
    with open(path, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"\nWrote {len(permits)} permits → {path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def parse_args():
    p = argparse.ArgumentParser(description="Pull NYC DOB A1/A2 eating & drinking permits.")
    p.add_argument("--days",    type=int, default=30,
                   help="How many days back to pull (default: 30)")
    p.add_argument("--borough", nargs="+", default=list(BOROUGH_MAP.keys()),
                   choices=list(BOROUGH_MAP.keys()),
                   metavar="CODE",
                   help="Borough codes: MN BK QN BX SI (default: all)")
    p.add_argument("--out", default=OUTPUT_FILE,
                   help=f"Output file (default: {OUTPUT_FILE})")
    return p.parse_args()


def main():
    args      = parse_args()
    since     = (datetime.now() - timedelta(days=args.days)).strftime("%Y-%m-%d")
    boros     = [b.upper() for b in args.borough]

    print(f"\nDOB pull — A1/A2 eating & drinking permits")
    print(f"  Window:   last {args.days} days (since {since})")
    print(f"  Boroughs: {', '.join(BOROUGH_MAP.get(b, b) for b in boros)}\n")

    try:
        rows = fetch_permits(since, boros)
    except requests.HTTPError as e:
        print(f"\nAPI error: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"\n  {len(rows)} permits after borough + use-group filter\n")

    if not rows:
        print("Nothing to write.")
        return

    permits = []
    for r in rows:
        try:
            filed_dt = datetime.fromisoformat(r["filing_date"][:10])
        except (KeyError, ValueError):
            continue
        permits.append(permit_to_js(r, filed_dt))

    write_jsx(permits, args.days, boros, args.out)
    print("\nNext steps:")
    print("  1. Reload Vestibule.html in the browser (the new data-permits.jsx is auto-loaded)")
    print("  2. Open Settings → DOB pull card to see the pull timestamp")
    print("  3. Review 'New' stage permits in the Weekly pull view")


if __name__ == "__main__":
    main()
