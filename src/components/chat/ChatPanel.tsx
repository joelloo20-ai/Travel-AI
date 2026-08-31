import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { MessageBubble, TypingBubble } from "./MessageBubble";
import { QuickReplies } from "./QuickReplies";
import type { usePlannerChat } from "../../hooks/usePlannerChat";

export function ChatPanel({ chat }: { chat: ReturnType<typeof usePlannerChat> }) {
  const { messages, isTyping, submitFreeText, submitQuickReply, submitMultiSelect } = chat;
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    submitFreeText(input);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.map((m) => (
          <div key={m.id} className="space-y-2.5">
            <MessageBubble message={m} />
            {m.role === "assistant" && m.quickReplies && m === lastMessage && (
              <QuickReplies
                options={m.quickReplies}
                multiSelect={m.multiSelect}
                onSingle={submitQuickReply}
                onMulti={submitMultiSelect}
              />
            )}
          </div>
        ))}
        {isTyping && <TypingBubble />}
      </div>

      <div className="border-t border-ink-100/70 bg-white/70 p-3 backdrop-blur-sm sm:p-4">
        <div className="flex items-center gap-2 rounded-full border border-ink-100 bg-white px-2 py-1.5 shadow-soft focus-within:border-coral-300">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={lastMessage?.quickReplies ? "Or type your own answer..." : "Message your travel assistant..."}
            className="flex-1 bg-transparent px-2.5 py-1.5 text-sm text-ink-800 outline-none placeholder:text-ink-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Send message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-500 text-white transition-opacity disabled:opacity-30"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
