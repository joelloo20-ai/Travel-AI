import { z } from "zod";

export const ReceiptSchema = z.object({
  merchant: z.string().describe("The business/vendor name on the receipt, title-cased. Use \"Unknown\" if illegible."),
  amount: z.number().describe("The final total amount paid, as a plain number (no currency symbol)."),
  currency: z.string().describe("ISO 4217 currency code, e.g. USD, EUR, JPY, THB, TWD, KRW. Guess from symbols/context if not printed."),
  date: z.string().nullable().describe("Transaction date as YYYY-MM-DD if printed on the receipt, else null."),
  category: z.enum(["flights", "lodging", "food", "activities", "transport", "shopping", "other"]).describe("Best-fit expense category for this receipt."),
  summary: z.string().describe("A short 3-6 word label for this expense, e.g. \"Dinner at Ichiran Ramen\"."),
});

export type ParsedReceipt = z.infer<typeof ReceiptSchema>;
