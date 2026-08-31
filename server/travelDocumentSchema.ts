import { z } from "zod";

export const TravelDocumentSchema = z.object({
  documentType: z
    .enum(["flight", "hotel", "train", "itinerary", "other"])
    .describe("Best guess at what kind of travel document this is."),
  destination: z
    .string()
    .nullable()
    .describe("The primary destination city, and country if known, e.g. \"Tokyo, Japan\". The arrival city for a flight, not the departure city. Null if not determinable."),
  startDate: z
    .string()
    .nullable()
    .describe("Trip start date (departure / check-in date) as YYYY-MM-DD if printed, else null."),
  endDate: z
    .string()
    .nullable()
    .describe("Trip end date (return / check-out date) as YYYY-MM-DD if printed, else null."),
  travelers: z
    .number()
    .int()
    .min(1)
    .nullable()
    .describe("Number of travelers/passengers/guests if stated, else null."),
  summary: z
    .string()
    .describe("A short 1-sentence human-readable summary of this document, e.g. \"Flight JL123, SFO to NRT, departing Mar 12\"."),
});

export type ParsedTravelDocument = z.infer<typeof TravelDocumentSchema>;
