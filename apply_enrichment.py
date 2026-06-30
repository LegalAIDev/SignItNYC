"""
Applies vestibule-enrichment-result-cleaned.json into data-restaurants.jsx.
Only touches Group A (leads with no current_website):
  - website: new website URL (or instagram_or_social if no website)
  - domain:  extracted from website (skipped for social URLs)
  - email:   primary contact email
  - allEmails: email + additional_emails joined by '; '
Writes data-restaurants.jsx in place.
"""

import json, re

RESULT_PATH = "vestibule-enrichment-result-cleaned.json"
DATA_PATH = "data-restaurants.jsx"
SOCIAL_DOMAINS = ("instagram.com", "facebook.com", "twitter.com", "tiktok.com", "linkedin.com")


def extract_domain(url):
    m = re.search(r"https?://(?:www\.)?([^/]+)", url.lower())
    if not m:
        return ""
    host = m.group(1)
    if any(s in host for s in SOCIAL_DOMAINS):
        return ""
    return host


def build_all_emails(email, additional):
    parts = [p.strip() for p in [email, additional] if p.strip()]
    seen = []
    for p in parts:
        for e in re.split(r"[;,]", p):
            e = e.strip()
            if e and e not in seen:
                seen.append(e)
    return "; ".join(seen)


# Load enrichment result (Group A only: no current_website)
enr = json.load(open(RESULT_PATH))
group_a = {
    l["camis"]: l
    for l in enr["leads"]
    if not l.get("current_website", "").strip()
}

# Parse data-restaurants.jsx
txt = open(DATA_PATH, encoding="utf-8").read()
header_end = txt.index("[")
header = txt[:header_end]
arr_txt = txt[header_end:].strip()
# strip trailing semicolon if present
if arr_txt.endswith(";"):
    arr_txt = arr_txt[:-1]
recs = json.loads(arr_txt)

applied = 0
skipped_already_has_website = 0

for rec in recs:
    camis = rec["camis"]
    enrich = group_a.get(camis)
    if not enrich:
        continue

    # Skip if this record already has a website (shouldn't happen for Group A, but be safe)
    if rec.get("website", "").strip():
        skipped_already_has_website += 1
        continue

    new_web = enrich.get("website", "").strip()
    social = enrich.get("instagram_or_social", "").strip()
    email = enrich.get("email", "").strip()
    add_emails = enrich.get("additional_emails", "").strip()

    # Determine best website URL
    url = new_web or social
    if url:
        rec["website"] = url
        rec["domain"] = extract_domain(url)

    if email or add_emails:
        rec["email"] = email
        rec["allEmails"] = build_all_emails(email, add_emails)

    if url or email:
        applied += 1

# Write back
arr_json = json.dumps(recs, indent=2)
out = header + arr_json + "\n"
open(DATA_PATH, "w", encoding="utf-8").write(out)

# Stats
has_web = sum(1 for r in recs if r.get("website", ""))
has_email = sum(1 for r in recs if r.get("email", ""))
print(f"Applied enrichment to {applied} records")
print(f"Skipped (already had website): {skipped_already_has_website}")
print(f"data-restaurants.jsx now has:")
print(f"  website: {has_web}/{len(recs)}")
print(f"  email:   {has_email}/{len(recs)}")
