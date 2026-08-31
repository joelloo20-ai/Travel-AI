import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { TravelDocumentSchema, type ParsedTravelDocument } from "./travelDocumentSchema";

const MODEL = "claude-sonnet-5";

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const PDF_TYPE = "application/pdf";

export interface TravelDocumentResult {
  parsed: ParsedTravelDocument | null;
  error?: string;
}

export async function parseTravelDocument(base64: string, mediaType: string): Promise<TravelDocumentResult> {
  if (!client) {
    return { parsed: null, error: "Document scanning needs an ANTHROPIC_API_KEY configured on the server." };
  }

  if (!IMAGE_TYPES.includes(mediaType) && mediaType !== PDF_TYPE) {
    return { parsed: null, error: "Unsupported file type — upload a photo or PDF of your ticket or itinerary." };
  }

  const fileBlock =
    mediaType === PDF_TYPE
      ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 } }
      : {
          type: "image" as const,
          source: { type: "base64" as const, media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: base64 },
        };

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4096,
      system:
        "You read travel documents (plane tickets, boarding passes, hotel confirmations, itineraries) and extract the trip's key details. Respond only through the tool, even for a partial or blurry document — make a best-effort guess and use null for anything genuinely not present.",
      messages: [
        {
          role: "user",
          content: [
            fileBlock,
            {
              type: "text",
              text: "Extract the document type, destination, start/end dates, and number of travelers from this travel document.",
            },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(TravelDocumentSchema) },
    });

    if (!response.parsed_output) {
      return { parsed: null, error: "Couldn't read this document — try a clearer photo or file." };
    }

    return { parsed: response.parsed_output };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("[travelDocumentService] Invalid ANTHROPIC_API_KEY:", err.message);
    } else if (err instanceof Anthropic.RateLimitError) {
      console.error("[travelDocumentService] Rate limited:", err.message);
    } else if (err instanceof Anthropic.APIError) {
      console.error(`[travelDocumentService] API error ${err.status}:`, err.message);
    } else {
      console.error("[travelDocumentService] Unexpected error:", err);
    }
    return { parsed: null, error: "Couldn't read this document right now — try again." };
  }
}
