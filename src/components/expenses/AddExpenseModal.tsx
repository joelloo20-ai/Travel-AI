import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Loader2, Receipt, X } from "lucide-react";
import { compressImage, makeThumbnail } from "../../utils/compressImage";
import { parseReceipt } from "../../services/receiptClient";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_META } from "../../data/expenseCategories";
import { newId, todayIso } from "../../utils/format";
import type { Expense, ExpenseCategory } from "../../types";

type Mode = "choose" | "scanning" | "review" | "manual";

export function AddExpenseModal({
  open,
  tripId,
  dayNumber,
  dayLabel,
  onClose,
  onAdd,
}: {
  open: boolean;
  tripId: string;
  dayNumber?: number;
  dayLabel: string;
  onClose: () => void;
  onAdd: (expense: Expense) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("choose");
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);
  const [scanError, setScanError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState<ExpenseCategory>("food");

  const reset = () => {
    setMode("choose");
    setThumbnail(undefined);
    setScanError(null);
    setLabel("");
    setAmount("");
    setCurrency("USD");
    setCategory("food");
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setMode("scanning");
    setScanError(null);
    try {
      const [{ dataUrl, mediaType }, thumb] = await Promise.all([compressImage(file), makeThumbnail(file)]);
      setThumbnail(thumb);
      const { parsed, error } = await parseReceipt(dataUrl, mediaType);
      if (!parsed) {
        setScanError(error ?? "Couldn't read this receipt.");
        setMode("manual");
        return;
      }
      setLabel(parsed.summary);
      setAmount(String(parsed.amount));
      setCurrency(parsed.currency || "USD");
      setCategory(parsed.category);
      setMode("review");
    } catch {
      setScanError("Something went wrong reading that photo.");
      setMode("manual");
    }
  };

  const save = () => {
    const amt = Number(amount);
    if (!label.trim() || !Number.isFinite(amt) || amt <= 0) return;
    onAdd({
      id: newId("exp"),
      tripId,
      dayNumber,
      category,
      label: label.trim(),
      amount: amt,
      currency,
      date: todayIso(),
      receiptImage: thumbnail,
    });
    close();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-sm rounded-t-3xl bg-white p-5 shadow-lift sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-coral-600">{dayLabel}</p>
                <h3 className="font-display text-lg font-medium text-ink-900">Add expense</h3>
              </div>
              <button onClick={close} className="rounded-full p-1.5 text-ink-400 hover:bg-ink-50">
                <X size={18} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />

            {mode === "choose" && (
              <div className="space-y-2.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-coral-200 bg-coral-50 p-4 text-left transition-colors hover:bg-coral-100"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-coral-500 text-white">
                    <Camera size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-800">Scan a receipt</p>
                    <p className="text-xs text-ink-400">Snap a photo — amount and category fill in for you</p>
                  </div>
                </button>
                <button
                  onClick={() => setMode("manual")}
                  className="flex w-full items-center gap-3 rounded-xl border border-ink-100 p-4 text-left hover:bg-ink-50"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-600">
                    <Receipt size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-800">Enter manually</p>
                    <p className="text-xs text-ink-400">Type it in yourself</p>
                  </div>
                </button>
              </div>
            )}

            {mode === "scanning" && (
              <div className="flex flex-col items-center gap-3 py-8">
                {thumbnail && <img src={thumbnail} alt="Receipt" className="h-24 w-24 rounded-lg object-cover opacity-70" />}
                <Loader2 size={22} className="animate-spin text-coral-500" />
                <p className="text-sm text-ink-500">Reading your receipt...</p>
              </div>
            )}

            {(mode === "review" || mode === "manual") && (
              <div className="space-y-3">
                {scanError && <p className="rounded-lg bg-coral-50 px-3 py-2 text-xs text-coral-700">{scanError}</p>}
                {thumbnail && mode === "review" && (
                  <div className="flex items-center gap-2 rounded-lg bg-teal-500/10 px-3 py-2 text-xs font-medium text-teal-700">
                    <Check size={14} />
                    Scanned — check the details below
                  </div>
                )}
                <div className="flex gap-2">
                  {thumbnail && <img src={thumbnail} alt="Receipt" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
                  <div className="flex-1 space-y-2">
                    <input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="What was it for?"
                      className="w-full rounded-lg border border-ink-100 bg-cream-50 px-3 py-2 text-sm text-ink-800 outline-none focus:border-coral-300"
                    />
                    <div className="flex gap-2">
                      <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        type="number"
                        min="0"
                        placeholder="Amount"
                        className="w-2/3 rounded-lg border border-ink-100 bg-cream-50 px-3 py-2 text-sm text-ink-800 outline-none focus:border-coral-300"
                      />
                      <input
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                        maxLength={3}
                        placeholder="USD"
                        className="w-1/3 rounded-lg border border-ink-100 bg-cream-50 px-3 py-2 text-center text-sm uppercase text-ink-800 outline-none focus:border-coral-300"
                      />
                    </div>
                  </div>
                </div>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full rounded-lg border border-ink-100 bg-cream-50 px-3 py-2 text-sm text-ink-700 outline-none focus:border-coral-300"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {EXPENSE_CATEGORY_META[c].label}
                    </option>
                  ))}
                </select>

                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={close} className="rounded-full px-4 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50">
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={!label.trim() || !amount}
                    className="rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
                  >
                    Save expense
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
