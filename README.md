# Wayfare — AI Trip Planner

An AI-assistant-driven travel planner: chat with a planning assistant to build a day-by-day itinerary, start from a ready-made template, and keep every saved trip and its expenses in one place.

## Features

- **Conversational planner** (`/`) — a chat assistant asks about destination, trip length, travelers, interests, and budget, then builds a full day-by-day itinerary live in the panel next to the chat.
- **Templates** (`/templates`) — pick a ready-made trip shape (City Explorer, Beach Relaxation, Backpacker Adventure, Romantic Getaway, Family Fun, Foodie Trail) and drop in your destination to generate an itinerary instantly.
- **My Trips** (`/trips`) — every saved trip as a card with dates, travelers, and estimated cost.
- **Trip detail** (`/trips/:id`) — edit the itinerary (remove activities, change status) and track expenses by category against the trip budget, with a spend breakdown chart.

## Tech stack

**Frontend:** React + TypeScript + Vite, Tailwind CSS v4, Zustand (persisted to `localStorage`), React Router, Recharts, Lucide icons.

**Backend:** a small Express server (`server/`) that holds the Anthropic API key and is the only thing that ever talks to Claude — the browser never sees the key.

## Itinerary generation

`POST /api/itinerary` (`server/index.ts` + `server/itineraryService.ts`) asks **Claude Opus 5** to plan a real, specific day-by-day itinerary — named neighborhoods, restaurants, and landmarks for the destination, not generic filler — and validates the response against a Zod schema (`server/itinerarySchema.ts`) via the SDK's structured-output support, so the result always matches the app's `ItineraryDay[]` shape.

If `ANTHROPIC_API_KEY` isn't set, or a request to Claude fails for any reason, the server transparently falls back to `src/services/itineraryGenerator.ts` — a rule-based generator over a destination-agnostic activity pool (`src/data/activityPool.ts`) — so the app always returns an itinerary. Every response carries a `source: "ai" | "template"` flag; the UI shows an "AI-planned" badge when Claude generated the plan, and surfaces a plain-language note in chat when it fell back.

## Development

```bash
npm install
cp .env.example .env   # then add your ANTHROPIC_API_KEY to get real AI-planned itineraries
npm run dev             # runs the Vite dev server + Express API together
npm run build            # typecheck + production build (frontend)
npm start                # run the production server (serves the built frontend + API from one process)
```

Without an `ANTHROPIC_API_KEY`, everything still works — itineraries just come from the built-in template generator instead of Claude.
