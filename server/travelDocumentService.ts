import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { TravelDocumentSchema, type ParsedTravelDocument } from "./travelDocumentSchema";

const MODEL = "claude-sonnet-5";

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const PDF_TYPE = "application/pdf";
const MAX_FILES = 6;

export interface TravelDocumentFile {
  base64: string;
  mediaType: string;
}

export interface TravelDocumentResult {
  parsed: ParsedTravelDocument | null;
  error?: string;
}

export async function parseTravelDocuments(files: TravelDocumentFile[]): Promise<TravelDocumentResult> {
  if (!client) {
    return { parsed: null, error: "Document scanning needs an ANTHROPIC_API_KEY configured on the server." };
  }

  if (files.length === 0) {
    return { parsed: null, error: "No files were uploaded." };
  }

  if (files.length > MAX_FILES) {
    return { parsed: null, error: `Upload up to ${MAX_FILES} files at a time.` };
  }

  const unsupported = files.find((f) => !IMAGE_TYPES.includes(f.mediaType) && f.mediaType !== PDF_TYPE);
  if (unsupported) {
    return { parsed: null, error: "Unsupported file type — upload photos or PDFs of your tickets or itinerary." };
  }

  const fileBlocks: ContentBlockParam[] = files.map((f) =>
    f.mediaType === PDF_TYPE
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: f.base64 } }
      : {
          type: "image",
          source: { type: "base64", media_type: f.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: f.base64 },
        }
  );

  const instruction =
    files.length > 1
      ? "These are separate travel documents for the same trip (e.g. a flight ticket and a hotel booking). Extract the destination, dates, and number of travelers, every flight leg across all of them, and the total price across all of them."
      : "Extract the destination, dates, number of travelers, every flight leg, and the total price from this travel document.";

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4096,
      system:
        "You read travel documents (plane tickets, boarding passes, hotel confirmations, itineraries) — sometimes several at once for the same trip — and extract their combined key details. Respond only through the tool, even for a partial or blurry document — make a best-effort guess and use null (or an empty array for flights) for anything genuinely not present.",
      messages: [
        {
          role: "user",
          content: [...fileBlocks, { type: "text", text: instruction }],
        },
      ],
      output_config: { format: zodOutputFormat(TravelDocumentSchema) },
    });

    if (!response.parsed_output) {
      return { parsed: null, error: "Couldn't read these documents — try clearer photos or files." };
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
    return { parsed: null, error: "Couldn't read these documents right now — try again." };
  }
}
