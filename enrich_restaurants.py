"""
Enrich new_restaurants.csv with website and email data.

Step 1 — Google Places API (Text Search):
  Query "{name} {address} New York" → get website URL for each restaurant.

Step 2 — Hunter.io Domain Search:
  Extract domain from website URL → search for public emails.

Writes results to new_restaurants_enriched.csv.
Progress is checkpointed to enrichment_cache.json so interrupted runs
can resume without re-fetching already-processed rows.

API keys — set as environment variables before running (never hardcode for production):
  GOOGLE_PLACES_API_KEY
  HUNTER_API_KEY
"""

import csv
import json
import os
import time
from urllib.parse import urlparse

import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

INPUT_CSV = "new_restaurants.csv"
OUTPUT_CSV = "new_restaurants_enriched.csv"
JS_OUTPUT = "data-restaurants.jsx"
JSON_OUTPUT = "../vestibule-app/public/restaurants.json"
CACHE_FILE = "enrichment_cache.json"

# TODO: set these env vars before running in production (see .env.example)
GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")
HUNTER_API_KEY = os.getenv("HUNTER_API_KEY", "")

# Seconds to wait between API calls (be a good citizen)
GOOGLE_DELAY = 0.1
HUNTER_DELAY = 0.2

# Stop calling Hunter after this many domain searches (free plan = 50)
HUNTER_SEARCH_LIMIT = 0  # Email lookup is triggered from the UI, not here


# ---------------------------------------------------------------------------
# Cache — persist results so reruns don't burn API quota
# ---------------------------------------------------------------------------

def load_cache() -> dict:
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache: dict) -> None:
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)


# ---------------------------------------------------------------------------
# Google Places — get website URL
# ---------------------------------------------------------------------------

def google_places_website(name: str, building: str, street: str, borough: str, zipcode: str) -> str:
    """
    Use the Places API (new) Text Search to find the restaurant and return
    its website URL. Returns empty string if not found.
    """
    address = f"{building} {street}".strip()
    query = f"{name} {address} {borough} New York"

    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.websiteUri,places.formattedAddress",
    }
    body = {
        "textQuery": query,
        "maxResultCount": 1,
        "locationBias": {
            "circle": {
                "center": {"latitude": 40.7128, "longitude": -74.0060},
                "radius": 50000,
            }
        },
    }

    try:
        resp = requests.post(url, json=body, headers=headers, timeout=10)
        resp.raise_for_status()
        places = resp.json().get("places", [])
        if places:
            return places[0].get("websiteUri", "")
    except requests.RequestException as e:
        print(f"    [Google] error for '{name}': {e}")

    return ""


# ---------------------------------------------------------------------------
# Hunter.io — find emails for a domain
# ---------------------------------------------------------------------------

def extract_domain(website_url: str) -> str:
    if not website_url:
        return ""
    try:
        parsed = urlparse(website_url)
        domain = parsed.netloc.lower()
        # Strip www.
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
    except Exception:
        return ""


def hunter_emails(domain: str) -> tuple[str, str]:
    """
    Query Hunter.io domain search. Returns (first_email, all_emails_joined).
    """
    if not domain:
        return "", ""

    url = "https://api.hunter.io/v2/domain-search"
    params = {
        "domain": domain,
        "api_key": HUNTER_API_KEY,
        "limit": 10,
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json().get("data", {})
        emails = [e["value"] for e in data.get("emails", []) if e.get("value")]
        if emails:
            return emails[0], "; ".join(emails)
    except requests.RequestException as e:
        print(f"    [Hunter] error for '{domain}': {e}")

    return "", ""


# ---------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------

def export_js(rows: list[dict], path: str) -> None:
    records = []
    for r in rows:
        records.append({
            "camis":           r.get("camis", ""),
            "name":            r.get("name", ""),
            "cuisine":         r.get("cuisine", ""),
            "borough":         r.get("borough", ""),
            "building":        r.get("building", ""),
            "street":          r.get("street", ""),
            "zipcode":         r.get("zipcode", ""),
            "phone":           r.get("phone", ""),
            "firstInspection": r.get("first_inspection", ""),
            "website":         r.get("website", ""),
            "domain":          r.get("domain", ""),
            "email":           r.get("email", ""),
            "allEmails":       r.get("all_emails", ""),
        })
    with open(path, "w", encoding="utf-8") as f:
        f.write("window.VESTIBULE_DATA = window.VESTIBULE_DATA || {};\n")
        f.write("window.VESTIBULE_DATA.RESTAURANTS = ")
        f.write(json.dumps(records, indent=2))
        f.write(";\n")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not GOOGLE_API_KEY:
        raise SystemExit("Set GOOGLE_PLACES_API_KEY environment variable before running.")
    if not HUNTER_API_KEY and HUNTER_SEARCH_LIMIT > 0:
        raise SystemExit("Set HUNTER_API_KEY environment variable before running.")

    rows = list(csv.DictReader(open(INPUT_CSV, encoding="utf-8")))
    cache = load_cache()

    print(f"Enriching {len(rows)} restaurants...")
    print(f"Already cached: {len(cache)}\n")

    hunter_searches_used = sum(1 for v in cache.values() if v.get("domain"))

    enriched = []
    for i, row in enumerate(rows):
        camis = row["camis"]

        if camis in cache:
            result = cache[camis]
        else:
            name = row["name"]
            print(f"[{i+1}/{len(rows)}] {name}")

            # Step 1: Google Places → website
            website = google_places_website(
                name, row["building"], row["street"], row["borough"], row["zipcode"]
            )
            time.sleep(GOOGLE_DELAY)

            # Step 2: Hunter → email (skip if credit cap reached)
            domain = extract_domain(website)
            first_email, all_emails = "", ""
            if domain:
                if hunter_searches_used < HUNTER_SEARCH_LIMIT:
                    first_email, all_emails = hunter_emails(domain)
                    hunter_searches_used += 1
                    time.sleep(HUNTER_DELAY)
                else:
                    print(f"    [Hunter] credit cap reached ({HUNTER_SEARCH_LIMIT}), skipping")

            result = {
                "website": website,
                "domain": domain,
                "email": first_email,
                "all_emails": all_emails,
            }
            cache[camis] = result
            save_cache(cache)

        enriched.append({**row, **result})

    # Write output
    fieldnames = list(rows[0].keys()) + ["website", "domain", "email", "all_emails"]
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(enriched)

    # Write JS data file
    export_js(enriched, JS_OUTPUT)

    # Write JSON for the Vite app
    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump([{
            "camis":           r.get("camis", ""),
            "name":            r.get("name", ""),
            "cuisine":         r.get("cuisine", ""),
            "borough":         r.get("borough", ""),
            "building":        r.get("building", ""),
            "street":          r.get("street", ""),
            "zipcode":         r.get("zipcode", ""),
            "phone":           r.get("phone", ""),
            "firstInspection": r.get("first_inspection", ""),
            "website":         r.get("website", ""),
            "domain":          r.get("domain", ""),
            "email":           r.get("email", ""),
            "allEmails":       r.get("all_emails", ""),
        } for r in enriched], f, indent=2)

    # Summary
    with_website = sum(1 for r in enriched if r["website"])
    with_email = sum(1 for r in enriched if r["email"])
    print(f"\nDone.")
    print(f"  With website: {with_website}/{len(enriched)}")
    print(f"  With email:   {with_email}/{len(enriched)}")
    print(f"  CSV:          {OUTPUT_CSV}")
    print(f"  JS data:      {JS_OUTPUT}")
    print(f"  App JSON:     {JSON_OUTPUT}")


if __name__ == "__main__":
    main()
