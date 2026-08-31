import clsx from "clsx";
import { Compass } from "lucide-react";
import type { ChatMessage } from "../../types";

/** Renders "**bold**" segments as <strong>; everything else is plain text. No other markdown. */
function renderBoldText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";
  return (
    <div className={clsx("flex animate-fade-up items-start gap-2.5", !isAssistant && "flex-row-reverse")}>
      {isAssistant && (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral-500 text-white">
          <Compass size={13} strokeWidth={2.5} />
        </span>
      )}
      <div
        className={clsx(
          "max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isAssistant ? "rounded-tl-sm bg-white text-ink-700 shadow-soft" : "rounded-tr-sm bg-ink-800 text-white"
        )}
      >
        {renderBoldText(message.text)}
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex animate-fade-up items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral-500 text-white">
        <Compass size={13} strokeWidth={2.5} />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-soft">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-400" style={{ animationDelay: "0ms" }} />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-400" style={{ animationDelay: "150ms" }} />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-400" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
