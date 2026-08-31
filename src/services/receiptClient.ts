import { apiUrl } from "./apiBase";
import type { ExpenseCategory } from "../types";

export interface ParsedReceipt {
  merchant: string;
  amount: number;
  currency: string;
  date: string | null;
  category: ExpenseCategory;
  summary: string;
}

export interface ReceiptResult {
  parsed: ParsedReceipt | null;
  error?: string;
}

/** dataUrl is a "data:image/jpeg;base64,...." string from compressImage(). */
export async function parseReceipt(dataUrl: string, mediaType: string): Promise<ReceiptResult> {
  const imageBase64 = dataUrl.split(",")[1] ?? "";
  try {
    const res = await fetch(apiUrl("/api/parse-receipt"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mediaType }),
    });
    if (!res.ok) throw new Error(`Receipt request failed (${res.status})`);
    return await res.json();
  } catch {
    return { parsed: null, error: "Couldn't reach the receipt scanner — enter it manually instead." };
  }
}
