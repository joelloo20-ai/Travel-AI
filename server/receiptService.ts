import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ReceiptSchema, type ParsedReceipt } from "./receiptSchema";

const MODEL = "claude-sonnet-5";

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export interface ReceiptResult {
  parsed: ParsedReceipt | null;
  error?: string;
}

export async function parseReceiptImage(base64: string, mediaType: string): Promise<ReceiptResult> {
  if (!client) {
    return { parsed: null, error: "Receipt scanning needs an ANTHROPIC_API_KEY configured on the server." };
  }

  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mediaType)) {
    return { parsed: null, error: "Unsupported image type." };
  }

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4096,
      system: "You read receipts and extract structured expense data. Respond only through the receipt tool, even for a blurry or partial receipt — make a best-effort guess rather than refusing.",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: base64 } },
            { type: "text", text: "Extract the merchant, total amount, currency, date, and best-fit category from this receipt." },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(ReceiptSchema) },
    });

    if (!response.parsed_output) {
      return { parsed: null, error: "Couldn't read this receipt — try a clearer photo, or enter it manually." };
    }

    return { parsed: response.parsed_output };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("[receiptService] Invalid ANTHROPIC_API_KEY:", err.message);
    } else if (err instanceof Anthropic.RateLimitError) {
      console.error("[receiptService] Rate limited:", err.message);
    } else if (err instanceof Anthropic.APIError) {
      console.error(`[receiptService] API error ${err.status}:`, err.message);
    } else {
      console.error("[receiptService] Unexpected error:", err);
    }
    return { parsed: null, error: "Couldn't read this receipt right now — try again, or enter it manually." };
  }
}
