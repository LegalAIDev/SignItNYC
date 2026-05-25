# Vestibule — Setup Guide

## What this is

A lead-pipeline dashboard for NYC sign shops. It pulls:
- **New restaurant permits** from NYC's DOB permit dataset
- **New restaurant inspections** from the DOHMH inspection dataset
- Enriches each lead with website and email via Google Places + Hunter.io

The app is a static HTML file — no build step, no server, no database. You open `Vestibule.html` in a browser and it works. The Python scripts generate the data files that the HTML page loads.

---

## Do you need all four tools?

| Tool | Needed? | Notes |
|---|---|---|
| **GitHub** | Yes | Version control; you already have the repo |
| **Claude Code** | Yes | For development and script work |
| **Netlify** | Optional | Only if you want a public URL; see below |
| **Supabase** | No | There is no database in this project |

**Simpler alternative to Netlify:** GitHub Pages is free, requires zero config, and works perfectly for this project. Instructions for both are below.

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/LegalAIDev/SignItNYC.git
cd SignItNYC
```

---

## Step 2 — Install Python dependencies

You need Python 3.8+. Check with `python --version`.

```bash
pip install requests
```

That's the only dependency. No virtual env required unless you prefer one.

---

## Step 3 — Get your API keys

You need three keys. Two are required to run the enrichment scripts; one is browser-only.

### A. Google Places API key (required for `enrich_restaurants.py`)

Used to look up website URLs for new restaurants.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or use an existing one)
3. Go to **APIs & Services → Library** and enable **Places API (New)**
4. Go to **APIs & Services → Credentials → Create Credentials → API Key**
5. (Recommended) Restrict the key to the Places API only
6. Copy the key — it starts with `AIzaSy...`

Cost: The Places Text Search API has a free tier (~$200/month credit). For a script that runs occasionally, it will likely cost nothing.

### B. Hunter.io API key (two uses — script + browser UI)

Used in two places:
- **`enrich_restaurants.py`** (script): batch-enriches the CSV with email addresses
- **The browser UI** (Restaurants tab): lets you look up emails live without re-running the script

1. Sign up for a free account at [hunter.io](https://hunter.io)
2. Go to **API → Your API key**
3. Copy the key

The free plan gives 50 domain searches/month. Upgrade if you need more.

### C. NYC Open Data app token (optional but recommended)

Without this token, the data scripts hit a rate-limited anonymous endpoint and may get throttled.

1. Sign up at [data.cityofnewyork.us](https://data.cityofnewyork.us/signup)
2. Go to **Edit Profile → Developer Settings → Create New App Token**
3. Copy the token

---

## Step 4 — Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:

```
GOOGLE_PLACES_API_KEY=AIzaSy...your key here...
HUNTER_API_KEY=...your key here...
NYC_OPEN_DATA_TOKEN=...your token here...   # optional
```

**Never commit `.env`** — it's already in `.gitignore`.

---

## Step 5 — Run the data scripts

Run these from the project folder. Each one generates a `.jsx` data file that the HTML page loads.

### Pull new restaurant permits (from NYC DOB)
```bash
python pull_dob.py
# Generates: data-permits.jsx
```

### Pull new restaurant inspections (from DOHMH)
```bash
python new_restaurants.py
# Generates: new_restaurants.csv
```

### Enrich with websites + emails (Google Places + Hunter.io)
```bash
GOOGLE_PLACES_API_KEY="your-key" HUNTER_API_KEY="your-key" python enrich_restaurants.py
# Generates: data-restaurants.jsx and new_restaurants_enriched.csv
```

On Windows (PowerShell):
```powershell
$env:GOOGLE_PLACES_API_KEY="your-key"; $env:HUNTER_API_KEY="your-key"; python enrich_restaurants.py
```

Or if you have a `.env` loader like `python-dotenv`, install it and add `load_dotenv()` at the top of each script.

The enrichment script is resumable — if it gets interrupted, rerun it and it picks up from the cache.

---

## Step 6 — Open the app

Just open `Vestibule.html` in a browser:

```bash
# Mac/Linux
open Vestibule.html

# Windows
start Vestibule.html
```

No server needed. If the data scripts haven't been run yet, load the demo data via **Settings → Load demo data**.

---

## Step 7 — Set the Hunter key in the browser

The Restaurants tab has a live email lookup feature that calls Hunter.io directly from the browser (without re-running the script). To enable it:

1. Open the app and go to the **Restaurants** tab
2. Click the **Hunter key** button
3. Paste your Hunter.io API key

The key is stored in your browser's localStorage — it never leaves your machine.

---

## Deployment (optional)

The app is a static HTML file, so hosting is simple.

### Option A — GitHub Pages (free, no config needed)

1. In your GitHub repo, go to **Settings → Pages**
2. Set **Source** to `Deploy from a branch`, branch `master`, folder `/ (root)`
3. Your app will be live at `https://legalaidev.github.io/SignItNYC/Vestibule.html`

### Option B — Netlify (slightly more polish, custom domain support)

1. Sign up at [netlify.com](https://netlify.com)
2. **Add new site → Import an existing project → GitHub**
3. Select the `SignItNYC` repo
4. Set:
   - **Build command:** *(leave blank)*
   - **Publish directory:** `.` (the root)
5. Click **Deploy site**

That's it — no build step, no environment variables needed on Netlify (the Python scripts run locally, not on the server).

---

## Ongoing workflow

The data files are regenerated locally and committed to the repo. The deployed site just serves whatever is in the repo.

```
1. Run pull_dob.py and/or new_restaurants.py + enrich_restaurants.py
2. git add data-permits.jsx data-restaurants.jsx new_restaurants_enriched.csv
3. git commit -m "refresh data"
4. git push
5. GitHub Pages / Netlify auto-deploys the update
```

---

## File map

| File | What it is |
|---|---|
| `Vestibule.html` | App entry point — open this in a browser |
| `app.jsx` | Main React shell and routing |
| `components.jsx` | Shared UI components |
| `views/` | One file per tab (dashboard, pipeline, restaurants, etc.) |
| `styles.css` | All styles |
| `data.jsx` | Empty data init (replaced at runtime by the data scripts) |
| `data-permits.jsx` | Generated by `pull_dob.py` — DOB permit leads |
| `data-restaurants.jsx` | Generated by `enrich_restaurants.py` — enriched restaurant leads |
| `pull_dob.py` | Pulls NYC DOB permit data |
| `new_restaurants.py` | Pulls DOHMH inspection data |
| `enrich_restaurants.py` | Enriches CSV with websites + emails |
| `.env.example` | Template for your `.env` file |
