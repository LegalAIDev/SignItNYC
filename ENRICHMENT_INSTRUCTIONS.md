# Lead Enrichment Task — Instructions for Codex

## Goal

We have a list of recently-opened NYC restaurants (sourced from the city's
DOHMH inspection data). For each one we want its **official website** and
**public contact info** so we can reach out. Your job is to search the web and
fill in the missing data.

## Input

`vestibule-enrichment-request.json` — a single JSON object with:

- `_task`, `_field_guide`, `_counts` — a short description and per-field guidance (read these first).
- `leads[]` — **646 restaurants** that are missing a website and/or an email.

Each lead looks like this:

```json
{
  "camis": "50175059",
  "name": "FRANKLIN TEMPLETON",
  "cuisine": "American",
  "address": "1 Madison Avenue, Manhattan, NY 10010",
  "borough": "Manhattan",
  "phone": "5708727018",
  "current_website": "",
  "website": "",
  "email": "",
  "additional_emails": "",
  "instagram_or_social": "",
  "contact_name": "",
  "source_url": "",
  "confidence": "",
  "notes": ""
}
```

There are two kinds of fields:

- **Context (READ-ONLY — do not change):** `camis`, `name`, `cuisine`,
  `address`, `borough`, `phone`, `current_website`.
  - `camis` is the unique join key. It is how we merge your results back into
    our app. **Never modify, reorder, or drop it.**
  - `current_website` is pre-filled for the ~343 leads that already have a known
    site. For those, you mainly need to find the **email/contact**, not the site.
- **To fill in:** `website`, `email`, `additional_emails`,
  `instagram_or_social`, `contact_name`, `source_url`, `confidence`, `notes`.

## What to do for each lead

1. **Identify the establishment.** Search by `name` + `address` (and `phone`
   if helpful). Confirm the match using the **address/borough** — NYC has many
   same-named places, so verify it's the right location before trusting a result.
2. **Find the official website.** Prefer the restaurant's **own domain**. Do
   **not** use aggregator/listing pages as the website (Yelp, DoorDash, Grubhub,
   Seamless, TripAdvisor, Facebook, Instagram). If the place only has social
   media and no real site, leave `website` blank and put the social URL in
   `instagram_or_social`.
3. **Find public contact email(s).** Look on the site's contact/about/footer
   pages. Put the best single address in `email` (prefer `info@`, `hello@`,
   `contact@`, or an owner/manager address). Put any others in
   `additional_emails`, separated by `"; "`. **Avoid `noreply@`** and
   personal-looking addresses that aren't meant for business contact.
4. **Record provenance.** Put the page where you found the website/email in
   `source_url`, and set `confidence` to `high`, `medium`, or `low` based on how
   sure you are this is the correct establishment.
5. **Use `notes` for anything important** — e.g. "permanently closed", "chain
   location — corporate contact only", "ambiguous, two candidates", "site under
   construction".

## Rules

- **Do not fabricate.** If you can't find something with reasonable confidence,
  leave the field as `""` and explain in `notes`. A blank is better than a wrong
  guess — wrong contacts waste outreach and burn sender reputation.
- **Do not change any READ-ONLY context field**, especially `camis`.
- **Keep the structure identical.** Same object shape, same `leads[]` order,
  same keys. Only the fill-in fields should change.

## Output

Return the **same JSON structure** with the fill-in fields populated. Write it
to a new file:

```
vestibule-enrichment-result.json
```

(Keep `_task`/`_field_guide`/`_counts` if convenient, but the only thing we
strictly need is the `leads[]` array with `camis` intact.) You may process the
646 leads in batches, as long as the final file contains all of them.

## What happens next

We merge your results back into the app by `camis`: any lead where you supplied
a `website` or `email` gets updated in our dataset and shows up on the lead
dashboard. That's why the join key and the "don't fabricate" rule matter most.
