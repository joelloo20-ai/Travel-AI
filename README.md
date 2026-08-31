# Wayfare — AI Trip Planner

An AI-assistant-driven travel planner: chat with a planning assistant to build a day-by-day itinerary, start from a ready-made template, and keep every saved trip and its expenses in one place.

## Features

- **Conversational planner** (`/`) — a chat assistant asks about destination, trip length, travelers, interests, and budget, then builds a full day-by-day itinerary live in the panel next to the chat. You can also upload a plane ticket or itinerary (photo or PDF) straight into the chat and Claude pulls out the destination, dates, and traveler count to jump-start the questions.
- **Popular Destinations** (`/templates`) — hand-crafted, specific 4-6 day itineraries for Taipei, Tokyo & Kyoto, Bangkok, and Seoul (real named neighborhoods, temples, and markets), ready to start instantly.
- **Templates** (`/templates`) — pick a ready-made trip shape (City Explorer, Beach Relaxation, Backpacker Adventure, Romantic Getaway, Family Fun, Foodie Trail) and drop in your destination to generate an itinerary instantly.
- **My Trips** (`/trips`) — every saved trip as a card with dates, travelers, and estimated cost. Pull down to refresh on touch devices.
- **Trip detail** (`/trips/:id`) — edit the itinerary (remove activities, change status), and a **Daily Log** tab that tracks expenses day-by-day alongside that day's planned activities.
- **Receipt scanning** — add an expense by snapping a photo; Claude reads the merchant, amount, currency, and category so you just confirm and save.
- **Google Sheets sync** (optional) — every expense you save can also append as a row to a Google Sheet in real time, so you (or anyone the sheet is shared with) can watch spending land live outside the app.

## Tech stack

**Frontend:** React + TypeScript + Vite, Tailwind CSS v4, Zustand (persisted to `localStorage`), React Router, Recharts, Framer Motion, Lucide icons.

**Backend:** a small Express server (`server/`) that holds the Anthropic API key and is the only thing that ever talks to Claude — the browser never sees the key.

## Itinerary generation

`POST /api/itinerary` (`server/index.ts` + `server/itineraryService.ts`) asks **Claude Sonnet 5** to plan a real, specific day-by-day itinerary — named neighborhoods, restaurants, and landmarks for the destination, not generic filler — and validates the response against a Zod schema (`server/itinerarySchema.ts`) via the SDK's structured-output support, so the result always matches the app's `ItineraryDay[]` shape.

If `ANTHROPIC_API_KEY` isn't set, or a request to Claude fails for any reason, the server transparently falls back to `src/services/itineraryGenerator.ts` — a rule-based generator over a destination-agnostic activity pool (`src/data/activityPool.ts`) — so the app always returns an itinerary. Every response carries a `source: "ai" | "template"` flag; the UI shows an "AI-planned" badge when Claude generated the plan, and surfaces a plain-language note in chat when it fell back.

## Travel document upload

`POST /api/parse-travel-document` (`server/travelDocumentService.ts`) lets you attach a plane ticket, boarding pass, hotel confirmation, or itinerary (image or PDF) from the paperclip button in the planner chat. Claude reads it as a vision/document input and returns structured JSON (document type, destination, start/end dates, traveler count) via the same Zod structured-output pattern as itinerary generation (`server/travelDocumentSchema.ts`). The assistant summarizes what it found and, if you confirm, fills in the draft and skips straight to whichever question — duration, travelers, interests — still needs an answer. Images are downscaled in the browser first (`src/utils/compressImage.ts`); PDFs are sent as-is, since Claude reads them natively. Without `ANTHROPIC_API_KEY`, or if a scan fails, the assistant says so in chat and you can keep going with the regular question flow.

## Receipt scanning

`POST /api/parse-receipt` (`server/receiptService.ts`) sends a photo to Claude Sonnet 5 as a vision input and asks for structured JSON back (merchant, amount, currency, date, category) via the same Zod structured-output pattern as itinerary generation. The photo is downscaled in the browser first (`src/utils/compressImage.ts`) before it's sent or stored. Without `ANTHROPIC_API_KEY`, or if a scan fails, the add-expense modal drops straight into manual entry with a plain-language explanation — it never blocks you from logging an expense.

## Google Sheets sync

Optional. When configured, every expense you save also appends as a row to a Google Sheet via a service account — no OAuth login flow, and the app never asks for your Google password.

**Setup (one-time, ~5 minutes):**
1. In the [Google Cloud Console](https://console.cloud.google.com/), create a project (or use an existing one).
2. **APIs & Services → Library** → enable the **Google Sheets API**.
3. **APIs & Services → Credentials → Create Credentials → Service Account**. Give it any name and finish the wizard (no roles needed).
4. Open the new service account → **Keys → Add Key → Create new key → JSON**. This downloads a `.json` file — keep it private, it's a credential.
5. Create (or open) the Google Sheet you want expenses to land in, and note its ID from the URL: `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`.
6. Click **Share** on that sheet and add the service account's email (looks like `something@your-project.iam.gserviceaccount.com`, found in the JSON file as `client_email`) as an **Editor**.
7. Set three environment variables (in `.env` locally, or your host's environment variables panel):
   - `GOOGLE_SHEET_ID` — the ID from step 5.
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the `client_email` field from the JSON.
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — the `private_key` field from the JSON, pasted as-is (it contains literal `\n` sequences — the app handles those; most host dashboards accept multi-line env values directly).

The app auto-detects this: the Daily Log tab shows a "Sheets sync on" badge once all three are set, and "Sheets not connected" otherwise — either way, expenses always save locally regardless of sync status. The first successful sync creates a header row (Date, Trip, Day, Category, Label, Amount, Currency, Note) automatically.

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

Either way, without `ANTHROPIC_API_KEY` set the live site still works — it just serves template-based itineraries instead of Claude-generated ones. Add the three `GOOGLE_*` variables from the Sheets setup above the same way (Render → your service → Environment) to enable live Sheets sync there too.

## Deploying (GitHub Pages — static only)

`.github/workflows/deploy-pages.yml` builds the frontend (`npm run build:pages`, which sets the correct `/Travel-AI/` base path) and publishes it to GitHub Pages on every push to `main`, or on demand via **Actions → Deploy static build to GitHub Pages → Run workflow**.

GitHub Pages only serves static files — there's no server, so `/api/itinerary` is unreachable there. The app detects this automatically and falls back to the local template generator (same as when no API key is set), so the site still works end to end; it just never calls Claude. For real AI-generated itineraries, use the Render deployment above instead.
