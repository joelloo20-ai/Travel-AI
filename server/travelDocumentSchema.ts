import { z } from "zod";

export const FlightLegSchema = z.object({
  airline: z.string().nullable().describe("Airline name, e.g. \"Japan Airlines\". Null if not printed."),
  flightNumber: z.string().nullable().describe("Flight number, e.g. \"JL123\". Null if not printed."),
  departureAirport: z.string().nullable().describe("Departure airport code or city name, e.g. \"SFO\". Null if not printed."),
  arrivalAirport: z.string().nullable().describe("Arrival airport code or city name, e.g. \"NRT\". Null if not printed."),
  departureTime: z.string().nullable().describe("Local departure date & time as printed, e.g. \"2026-03-12 14:30\". Null if not printed."),
  arrivalTime: z.string().nullable().describe("Local arrival date & time as printed. Null if not printed."),
});

export const TravelDocumentSchema = z.object({
  documentType: z
    .enum(["flight", "hotel", "train", "itinerary", "other"])
    .describe("Best guess at what kind of travel document this is. If multiple documents were uploaded together, pick the most prominent type."),
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
  travelerNames: z
    .array(z.string())
    .describe("First names (or full names) of each traveler/passenger/guest found on the document(s). Empty array if none are printed."),
  flights: z
    .array(FlightLegSchema)
    .max(12)
    .describe("Every flight leg found across the uploaded document(s), in chronological order. Empty array if none are present."),
  totalCost: z
    .number()
    .nullable()
    .describe("Total price paid or due, summed across every uploaded document if more than one was provided. Null if no price is printed anywhere."),
  currency: z
    .string()
    .nullable()
    .describe("ISO 4217 currency code for totalCost, e.g. USD, EUR, JPY. Null if totalCost is null."),
  summary: z
    .string()
    .describe(
      "A short 1-2 sentence human-readable summary of what was found, e.g. \"A round-trip flight JL123/JL124, SFO to NRT, and a 6-night hotel booking in Shinjuku.\" If multiple documents were uploaded, summarize them together."
    ),
});

export type ParsedTravelDocument = z.infer<typeof TravelDocumentSchema>;
