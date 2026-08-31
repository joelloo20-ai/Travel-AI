export interface ParsedFlightLeg {
  airline: string | null;
  flightNumber: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
}

export interface ParsedTravelDocument {
  documentType: "flight" | "hotel" | "train" | "itinerary" | "other";
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  travelers: number | null;
  flights: ParsedFlightLeg[];
  totalCost: number | null;
  currency: string | null;
  summary: string;
}

export interface TravelDocumentResult {
  parsed: ParsedTravelDocument | null;
  error?: string;
}

export interface UploadedFile {
  /** "data:<mediaType>;base64,...." string. */
  dataUrl: string;
  mediaType: string;
}

export async function parseTravelDocuments(files: UploadedFile[]): Promise<TravelDocumentResult> {
  try {
    const res = await fetch("/api/parse-travel-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: files.map((f) => ({ fileBase64: f.dataUrl.split(",")[1] ?? "", mediaType: f.mediaType })),
      }),
    });
    if (!res.ok) throw new Error(`Document request failed (${res.status})`);
    return await res.json();
  } catch {
    return { parsed: null, error: "Couldn't reach the document scanner — try again in a moment." };
  }
}
