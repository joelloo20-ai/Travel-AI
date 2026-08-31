import { useState } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";

export function QuickReplies({
  options,
  multiSelect,
  onSingle,
  onMulti,
}: {
  options: string[];
  multiSelect?: boolean;
  onSingle: (label: string) => void;
  onMulti: (labels: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  if (!multiSelect) {
    return (
      <div className="ml-9 flex flex-wrap gap-2 animate-fade-up">
        {options.map((label) => (
          <button
            key={label}
            onClick={() => onSingle(label)}
            className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  const toggle = (label: string) => {
    setSelected((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  };

  return (
    <div className="ml-9 flex flex-col gap-2.5 animate-fade-up">
      <div className="flex flex-wrap gap-2">
        {options.map((label) => {
          const active = selected.includes(label);
          return (
            <button
              key={label}
              onClick={() => toggle(label)}
              className={clsx(
                "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              )}
            >
              {active && <Check size={13} strokeWidth={3} />}
              {label}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onMulti(selected)}
        className="w-fit rounded-full bg-ink-800 px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Continue
      </button>
    </div>
  );
}
