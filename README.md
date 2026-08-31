# Wayfare — AI Trip Planner

An AI-assistant-driven travel planner: chat with a planning assistant to build a day-by-day itinerary, start from a ready-made template, and keep every saved trip and its expenses in one place.

## Features

- **Conversational planner** (`/`) — a chat assistant asks about destination, trip length, travelers, interests, and budget, then builds a full day-by-day itinerary live in the panel next to the chat.
- **Templates** (`/templates`) — pick a ready-made trip shape (City Explorer, Beach Relaxation, Backpacker Adventure, Romantic Getaway, Family Fun, Foodie Trail) and drop in your destination to generate an itinerary instantly.
- **My Trips** (`/trips`) — every saved trip as a card with dates, travelers, and estimated cost.
- **Trip detail** (`/trips/:id`) — edit the itinerary (remove activities, change status) and track expenses by category against the trip budget, with a spend breakdown chart.

## Tech stack

React + TypeScript + Vite, Tailwind CSS v4, Zustand (persisted to `localStorage`), React Router, Recharts, Lucide icons.

## Itinerary generation

`src/services/itineraryGenerator.ts` is a rule-based generator that fills a day-by-day plan from a destination-agnostic activity pool (`src/data/activityPool.ts`), scaled by pace, interests, and budget. It's intentionally isolated behind a single function so it can be swapped for a real LLM call (e.g. the Claude API) later without touching any UI code — the input/output shape already matches what a prompt-based generator would need.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # typecheck + production build
```
