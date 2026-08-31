import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { z } from "zod";
import { buildItinerary } from "./itineraryService";
import type { InterestTag, TripPace } from "../src/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;

const app = express();
app.use(express.json());

const INTEREST_TAGS = ["food", "culture", "nature", "nightlife", "shopping", "adventure", "relaxation", "family"] as const;
const PACES = ["relaxed", "balanced", "packed"] as const;

const ItineraryRequestSchema = z.object({
  destination: z.string().trim().min(1).max(120),
  days: z.number().int().min(1).max(30),
  pace: z.enum(PACES),
  interests: z.array(z.enum(INTEREST_TAGS)).max(8),
  startDate: z.string().nullable(),
  budget: z.number().min(0),
  travelers: z.number().int().min(1).max(20),
});

app.post("/api/itinerary", async (req, res) => {
  const parsed = ItineraryRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const params = {
    ...parsed.data,
    interests: parsed.data.interests as InterestTag[],
    pace: parsed.data.pace as TripPace,
  };

  const result = await buildItinerary(params);
  res.json(result);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(process.env.ANTHROPIC_API_KEY) });
});

const distDir = path.resolve(__dirname, "../dist");
app.use(express.static(distDir));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) {
    next();
    return;
  }
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err) next(err);
  });
});

app.listen(PORT, () => {
  console.log(`Wayfare server listening on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY is not set — itinerary requests will fall back to the built-in template generator.");
  }
});
