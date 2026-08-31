# Wayfare — AI Trip Planner

An AI-assistant-driven travel planner: chat with a planning assistant to build a day-by-day itinerary, start from a ready-made template, and keep every saved trip and its expenses in one place.

## Features

- **Conversational planner** (`/`) — a chat assistant asks about destination, trip length, travelers, interests, and budget, then builds a full day-by-day itinerary live in the panel next to the chat.
- **Popular Destinations** (`/templates`) — hand-crafted, specific 4-6 day itineraries for Taipei, Tokyo & Kyoto, Bangkok, and Seoul (real named neighborhoods, temples, and markets), ready to start instantly.
- **Templates** (`/templates`) — pick a ready-made trip shape (City Explorer, Beach Relaxation, Backpacker Adventure, Romantic Getaway, Family Fun, Foodie Trail) and drop in your destination to generate an itinerary instantly.
- **My Trips** (`/trips`) — every saved trip as a card with dates, travelers, and estimated cost. Pull down to refresh on touch devices.
- **Trip detail** (`/trips/:id`) — edit the itinerary (remove activities, change status), and a **Daily Log** tab that tracks expenses day-by-day alongside that day's planned activities.
- **Receipt scanning** — add an expense by snapping a photo; Claude reads the merchant, amount, currency, and category so you just confirm and save.
- **Google Sheets sync** (optional) — every trip you plan (AI-generated, from a template, or a curated destination) writes its full day-by-day itinerary to its own tab in a Google Sheet, and every expense you save appends as a row there too, in real time — so you (or anyone the sheet is shared with) can see plans and spending land live outside the app. Works on the static GitHub Pages build too, since it talks directly to a Google Apps Script Web App rather than a server.

## Tech stack

**Frontend:** React + TypeScript + Vite, Tailwind CSS v4, Zustand (persisted to `localStorage`), React Router, Recharts, Framer Motion, Lucide icons.

**Backend:** a small Express server (`server/`) that holds the Anthropic API key and is the only thing that ever talks to Claude — the browser never sees the key.

## Itinerary generation

`POST /api/itinerary` (`server/index.ts` + `server/itineraryService.ts`) asks **Claude Sonnet 5** to plan a real, specific day-by-day itinerary — named neighborhoods, restaurants, and landmarks for the destination, not generic filler — and validates the response against a Zod schema (`server/itinerarySchema.ts`) via the SDK's structured-output support, so the result always matches the app's `ItineraryDay[]` shape.

If `ANTHROPIC_API_KEY` isn't set, or a request to Claude fails for any reason, the server transparently falls back to `src/services/itineraryGenerator.ts` — a rule-based generator over a destination-agnostic activity pool (`src/data/activityPool.ts`) — so the app always returns an itinerary. Every response carries a `source: "ai" | "template"` flag; the UI shows an "AI-planned" badge when Claude generated the plan, and surfaces a plain-language note in chat when it fell back.

## Receipt scanning

`POST /api/parse-receipt` (`server/receiptService.ts`) sends a photo to Claude Sonnet 5 as a vision input and asks for structured JSON back (merchant, amount, currency, date, category) via the same Zod structured-output pattern as itinerary generation. The photo is downscaled in the browser first (`src/utils/compressImage.ts`) before it's sent or stored. Without `ANTHROPIC_API_KEY`, or if a scan fails, the add-expense modal drops straight into manual entry with a plain-language explanation — it never blocks you from logging an expense.

## Google Sheets sync

Optional. When configured, every trip's full itinerary and every expense you save also lands in a shared Google Sheet — written from the *browser*, directly, via a Google Apps Script Web App. There's no service account and no server involved, which is what makes this work even on the static GitHub Pages deployment.

Each trip gets its own tab (named after the destination). A companion Google Form feeding the same sheet still works side by side — the app and the Form both write into the same per-trip tab, tagged with a `Source` column ("App" or "Form") so you can tell them apart, and creating a trip in the app automatically adds it as an option on the Form too.

**Setup (one-time, ~10 minutes):**
1. Open (or create) the Google Sheet you want trips and expenses to land in.
2. **Extensions → Apps Script**, and replace the default `Code.gs` contents with [`apps-script/Code.gs`](apps-script/Code.gs) from this repo.
3. Edit the constants near the top of the script: set `SPREADSHEET_ID` to your sheet's ID (from its URL: `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`), `FORM_ID` to your Form's ID if you're using the Form + App combo (leave the placeholder if you're not — it just means trip names won't auto-sync to a Form), and change `SHARED_SECRET` to a value of your own choosing.
4. **Deploy → New deployment**, type **Web app**, execute as **Me**, who has access **Anyone**. Deploy, and copy the `/exec` URL it gives you.
5. Set two environment variables (in `.env` locally, and as a **repo secret** for GitHub Pages / an environment variable for Render — see the deploy sections below):
   - `VITE_APPS_SCRIPT_URL` — the `/exec` URL from step 4.
   - `VITE_APPS_SCRIPT_SHARED_SECRET` — the same value you set for `SHARED_SECRET` in step 3.
6. Rebuild the app. These are build-time Vite variables (`VITE_*`), so changing them always requires a rebuild, not just a restart.

The Daily Log tab shows a "Sheets sync on" badge once both variables are set at build time, and "Sheets not connected" otherwise — either way, trips and expenses always save locally regardless of sync status. Because `VITE_*` variables ship inside the JS bundle on a static site, `SHARED_SECRET` is only a light deterrent (anyone who opens dev tools on the live site can read it and the Web App URL), not real authentication — don't reuse a secret you care about elsewhere for it.

## Development

```bash
npm install
cp .env.example .env   # then add your ANTHROPIC_API_KEY to get real AI-planned itineraries
npm run dev             # runs the Vite dev server + Express API together
npm run build            # typecheck + production build (frontend)
npm start                # run the production server (serves the built frontend + API from one process)
```

Without an `ANTHROPIC_API_KEY`, everything still works — itineraries just come from the built-in template generator instead of Claude.

## Deploying (Render)

The app ships as one Node process — `npm run build` builds the frontend into `dist/`, `npm start` runs the Express server, which serves `dist/` as static files *and* the `/api/*` routes on the same port. That single-process shape works on any Node host; a `render.yaml` blueprint is included for [Render](https://render.com/).

**Option A — Blueprint (one click):**
1. In the Render dashboard: **New +** → **Blueprint**, pick this repo. Render reads `render.yaml` and creates the service for you.
2. When prompted, set the `ANTHROPIC_API_KEY` environment variable (it's marked as a secret in the blueprint, so Render will ask for it rather than reading it from the repo).
3. Deploy. Render runs `npm install --include=dev && npm run build`, then `npm start`, and gives you a `https://<your-service>.onrender.com` URL.

**Option B — Manual web service:**
1. **New +** → **Web Service** → connect this repo.
2. Runtime: `Node`. Build command: `npm install --include=dev && npm run build`. Start command: `npm start`.
3. Add environment variable `ANTHROPIC_API_KEY` with your key.
4. Deploy.

Either way, without `ANTHROPIC_API_KEY` set the live site still works — it just serves template-based itineraries instead of Claude-generated ones. Add the two `VITE_APPS_SCRIPT_*` variables from the Sheets setup above the same way (Render → your service → Environment) to enable live Sheets sync there too — and trigger a manual deploy afterward, since they're read at build time.

## Deploying (GitHub Pages — static only)

`.github/workflows/deploy-pages.yml` builds the frontend (`npm run build:pages`, which sets the correct `/Travel-AI/` base path) and publishes it to GitHub Pages on every push to `main`, or on demand via **Actions → Deploy static build to GitHub Pages → Run workflow**.

GitHub Pages only serves static files — there's no server, so `/api/itinerary` is unreachable there. The app detects this automatically and falls back to the local template generator (same as when no API key is set), so the site still works end to end; it just never calls Claude. For real AI-generated itineraries, use the Render deployment above instead.

Google Sheets sync isn't affected by the missing server — it always talks directly to the Apps Script Web App from the browser (see the "Google Sheets sync" section above), so it works the same on GitHub Pages as anywhere else. To enable it here, add `VITE_APPS_SCRIPT_URL` and `VITE_APPS_SCRIPT_SHARED_SECRET` as **repository secrets** (**Settings → Secrets and variables → Actions → New repository secret**) — the workflow passes them into the build automatically.
