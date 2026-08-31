export interface ParsedTravelDocument {
  documentType: "flight" | "hotel" | "train" | "itinerary" | "other";
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  travelers: number | null;
  summary: string;
}

export interface TravelDocumentResult {
  parsed: ParsedTravelDocument | null;
  error?: string;
}

/** dataUrl is a "data:<mediaType>;base64,...." string. */
export async function parseTravelDocument(dataUrl: string, mediaType: string): Promise<TravelDocumentResult> {
  const fileBase64 = dataUrl.split(",")[1] ?? "";
  try {
    const res = await fetch("/api/parse-travel-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileBase64, mediaType }),
    });
    if (!res.ok) throw new Error(`Document request failed (${res.status})`);
    return await res.json();
  } catch {
    return { parsed: null, error: "Couldn't reach the document scanner — try again in a moment." };
  }
}
