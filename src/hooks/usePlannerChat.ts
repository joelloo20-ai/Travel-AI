import { useCallback, useRef, useState } from "react";
import { requestItinerary } from "../services/itineraryClient";
import type { ChatMessage, InterestTag, ItineraryDay, TripPace } from "../types";

type Step =
  | "destination"
  | "duration"
  | "travelers"
  | "interests"
  | "budget"
  | "pace"
  | "generating"
  | "done";

interface Draft {
  destination: string;
  days: number;
  startDate: string | null;
  travelers: number;
  interests: InterestTag[];
  budget: number;
  pace: TripPace;
}

const INTEREST_OPTIONS: { label: string; value: InterestTag }[] = [
  { label: "Food & drink", value: "food" },
  { label: "Culture & history", value: "culture" },
  { label: "Nature & outdoors", value: "nature" },
  { label: "Nightlife", value: "nightlife" },
  { label: "Shopping", value: "shopping" },
  { label: "Adventure", value: "adventure" },
  { label: "Relaxation", value: "relaxation" },
  { label: "Family-friendly", value: "family" },
];

const DURATION_OPTIONS: { label: string; days: number }[] = [
  { label: "Long weekend (3 days)", days: 3 },
  { label: "A week (7 days)", days: 7 },
  { label: "Two weeks (14 days)", days: 14 },
];

const TRAVELER_OPTIONS: { label: string; count: number }[] = [
  { label: "Just me", count: 1 },
  { label: "A couple", count: 2 },
  { label: "Family (4)", count: 4 },
  { label: "Group (6)", count: 6 },
];

const BUDGET_OPTIONS: { label: string; amountPerDay: number }[] = [
  { label: "Budget ($)", amountPerDay: 80 },
  { label: "Mid-range ($$)", amountPerDay: 160 },
  { label: "Luxury ($$$)", amountPerDay: 350 },
];

const PACE_OPTIONS: { label: string; value: TripPace }[] = [
  { label: "Relaxed — a couple things a day", value: "relaxed" },
  { label: "Balanced — a full but easy day", value: "balanced" },
  { label: "Packed — see everything", value: "packed" },
];

function makeMessage(role: ChatMessage["role"], text: string, quickReplies?: string[], multiSelect?: boolean): ChatMessage {
  return {
    id: `msg-${Math.random().toString(36).slice(2, 10)}`,
    role,
    text,
    quickReplies,
    multiSelect,
    createdAt: new Date().toISOString(),
  };
}

const INITIAL_MESSAGE = makeMessage(
  "assistant",
  "Hi! I'm your Wayfare planning assistant. Tell me where you're headed and I'll put together a day-by-day itinerary with you. Where do you want to go?"
);

export function usePlannerChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [step, setStep] = useState<Step>("destination");
  const [isTyping, setIsTyping] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<ItineraryDay[] | null>(null);
  const [itinerarySource, setItinerarySource] = useState<"ai" | "template" | null>(null);
  const draftRef = useRef<Draft>({
    destination: "",
    days: 5,
    startDate: null,
    travelers: 1,
    interests: [],
    budget: 0,
    pace: "balanced",
  });

  const pushAssistant = useCallback((text: string, quickReplies?: string[], multiSelect?: boolean, delayMs = 500) => {
    setIsTyping(true);
    window.setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, makeMessage("assistant", text, quickReplies, multiSelect)]);
    }, delayMs);
  }, []);

  const pushUser = useCallback((text: string) => {
    setMessages((prev) => [...prev, makeMessage("user", text)]);
  }, []);

  const runGeneration = useCallback(async () => {
    setStep("generating");
    setIsTyping(true);
    const d = draftRef.current;

    try {
      const { itinerary, source, warning } = await requestItinerary({
        destination: d.destination,
        days: d.days,
        pace: d.pace,
        interests: d.interests,
        startDate: d.startDate,
        budget: d.budget,
        travelers: d.travelers,
      });
      setGeneratedItinerary(itinerary);
      setItinerarySource(source);
      setIsTyping(false);
      const summary =
        source === "ai"
          ? `Here's a first pass at ${d.days} days in ${d.destination} — take a look on the right. You can tweak anything, then save it to your trips whenever you're ready.`
          : `Here's a quick-start plan for ${d.days} days in ${d.destination} (${warning ?? "using the built-in template"}). Take a look on the right — you can tweak anything, then save it to your trips.`;
      setMessages((prev) => [...prev, makeMessage("assistant", summary)]);
      setStep("done");
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        makeMessage(
          "assistant",
          "I couldn't reach the planning service just now. Want to try again?",
          ["Try again"]
        ),
      ]);
      setStep("pace");
    }
  }, []);

  const submitFreeText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      pushUser(trimmed);

      if (step === "destination") {
        draftRef.current.destination = trimmed;
        setStep("duration");
        pushAssistant(`${trimmed} is a great choice. How long is the trip?`, DURATION_OPTIONS.map((o) => o.label));
        return;
      }

      if (step === "budget") {
        const parsed = Number(trimmed.replace(/[^0-9.]/g, ""));
        draftRef.current.budget = Number.isFinite(parsed) && parsed > 0 ? parsed : draftRef.current.budget;
        setStep("pace");
        pushAssistant("Got it. Last thing — how packed do you want each day to be?", PACE_OPTIONS.map((o) => o.label));
        return;
      }

      // Free text fallback for any other step just re-prompts.
      pushAssistant("Got it — you can also tap one of the options below.");
    },
    [step, pushAssistant, pushUser]
  );

  const submitQuickReply = useCallback(
    (label: string) => {
      pushUser(label);

      if (label === "Try again") {
        runGeneration();
        return;
      }

      if (step === "duration") {
        const match = DURATION_OPTIONS.find((o) => o.label === label);
        draftRef.current.days = match?.days ?? 5;
        setStep("travelers");
        pushAssistant("Who's traveling?", TRAVELER_OPTIONS.map((o) => o.label));
        return;
      }

      if (step === "travelers") {
        const match = TRAVELER_OPTIONS.find((o) => o.label === label);
        draftRef.current.travelers = match?.count ?? 1;
        setStep("interests");
        pushAssistant(
          "What do you want more of on this trip? Pick as many as you like, then hit Continue.",
          INTEREST_OPTIONS.map((o) => o.label),
          true
        );
        return;
      }

      if (step === "budget") {
        const match = BUDGET_OPTIONS.find((o) => o.label === label);
        const perDay = match?.amountPerDay ?? 160;
        draftRef.current.budget = perDay * draftRef.current.days * draftRef.current.travelers;
        setStep("pace");
        pushAssistant("Got it. Last thing — how packed do you want each day to be?", PACE_OPTIONS.map((o) => o.label));
        return;
      }

      if (step === "pace") {
        const match = PACE_OPTIONS.find((o) => o.label === label);
        draftRef.current.pace = match?.value ?? "balanced";
        pushAssistant("Great — building your itinerary now...", undefined, false, 300);
        runGeneration();
        return;
      }
    },
    [step, pushAssistant, pushUser, runGeneration]
  );

  const submitMultiSelect = useCallback(
    (labels: string[]) => {
      pushUser(labels.length ? labels.join(", ") : "Surprise me");
      const selected = INTEREST_OPTIONS.filter((o) => labels.includes(o.label)).map((o) => o.value);
      draftRef.current.interests = selected.length ? selected : ["culture", "food"];
      setStep("budget");
      pushAssistant("What's your budget vibe for this trip?", BUDGET_OPTIONS.map((o) => o.label));
    },
    [pushAssistant, pushUser]
  );

  return {
    messages,
    step,
    isTyping,
    generatedItinerary,
    itinerarySource,
    draft: draftRef.current,
    interestOptions: INTEREST_OPTIONS,
    submitFreeText,
    submitQuickReply,
    submitMultiSelect,
  };
}
