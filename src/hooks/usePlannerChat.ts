import { useCallback, useRef, useState } from "react";
import { requestItinerary } from "../services/itineraryClient";
import { parseTravelDocuments, type ParsedTravelDocument } from "../services/travelDocumentClient";
import { readUploadedDocument } from "../utils/compressImage";
import { formatCurrency } from "../utils/format";
import type { ChatMessage, ExpenseCategory, InterestTag, ItineraryDay, TripPace } from "../types";

export interface PendingExpense {
  amount: number;
  currency: string;
  category: ExpenseCategory;
  label: string;
}

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

const MAX_UPLOAD_FILES = 6;

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

interface StepPrompt {
  text: string;
  quickReplies?: string[];
  multiSelect?: boolean;
}

const INITIAL_PROMPT: StepPrompt = {
  text: "Hi! I'm your Wayfare planning assistant. Tell me where you're headed and I'll put together a day-by-day itinerary with you. Where do you want to go?",
};

const INITIAL_MESSAGE = makeMessage("assistant", INITIAL_PROMPT.text);

// Builds a deterministic recap from the structured fields (flight legs, total price) rather
// than trusting Claude's freeform summary alone to mention them.
function formatExtractionRecap(parsed: ParsedTravelDocument): string {
  const lines = [parsed.summary];

  if (parsed.flights.length) {
    const legs = parsed.flights.map((f) => {
      const carrier = [f.airline, f.flightNumber].filter(Boolean).join(" ") || "Flight";
      const route = [f.departureAirport, f.arrivalAirport].filter(Boolean).join(" → ");
      const time = f.departureTime ? ` — ${f.departureTime}` : "";
      return `• ${carrier}${route ? ` (${route})` : ""}${time}`;
    });
    lines.push(legs.join("\n"));
  }

  if (parsed.totalCost != null) {
    lines.push(`Total: ${formatCurrency(parsed.totalCost, parsed.currency ?? "USD")}`);
  }

  lines.push("Want me to use these details to start planning?");
  return lines.join("\n\n");
}

export function usePlannerChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [step, setStep] = useState<Step>("destination");
  const [isTyping, setIsTyping] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<ItineraryDay[] | null>(null);
  const [itinerarySource, setItinerarySource] = useState<"ai" | "template" | null>(null);
  const [pendingExpense, setPendingExpense] = useState<PendingExpense | null>(null);
  const draftRef = useRef<Draft>({
    destination: "",
    days: 5,
    startDate: null,
    travelers: 1,
    interests: [],
    budget: 0,
    pace: "balanced",
  });
  // Remembers the most recent step-defining question, so we can re-ask it if the
  // user declines to use details extracted from an uploaded document.
  const lastStepPromptRef = useRef<StepPrompt>(INITIAL_PROMPT);
  const pendingExtractionRef = useRef<ParsedTravelDocument | null>(null);

  const pushAssistant = useCallback((text: string, quickReplies?: string[], multiSelect?: boolean, delayMs = 500) => {
    setIsTyping(true);
    window.setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, makeMessage("assistant", text, quickReplies, multiSelect)]);
    }, delayMs);
  }, []);

  // Like pushAssistant, but also remembers the prompt as the "current step question"
  // so it can be replayed if the user backs out of a document-extraction confirmation.
  const pushAssistantStep = useCallback(
    (text: string, quickReplies?: string[], multiSelect?: boolean, delayMs = 500) => {
      lastStepPromptRef.current = { text, quickReplies, multiSelect };
      pushAssistant(text, quickReplies, multiSelect, delayMs);
    },
    [pushAssistant]
  );

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

  // Folds details pulled from an uploaded document into the draft, then jumps
  // straight to whichever step still needs an answer.
  const applyExtractionAndAdvance = useCallback(() => {
    const parsed = pendingExtractionRef.current;
    pendingExtractionRef.current = null;
    if (!parsed) return;

    const d = draftRef.current;
    if (parsed.destination) d.destination = parsed.destination;
    if (parsed.startDate) d.startDate = parsed.startDate;

    let gotDuration = false;
    if (parsed.startDate && parsed.endDate) {
      const start = new Date(parsed.startDate);
      const end = new Date(parsed.endDate);
      const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
      if (diffDays > 0) {
        d.days = diffDays;
        gotDuration = true;
      }
    }
    if (parsed.travelers) d.travelers = parsed.travelers;

    if (parsed.totalCost != null) {
      const label = parsed.flights.length
        ? [parsed.flights[0].airline, parsed.flights[0].flightNumber].filter(Boolean).join(" ") || "Flight booking"
        : parsed.documentType === "hotel"
          ? "Hotel booking"
          : "Trip booking";
      setPendingExpense({
        amount: parsed.totalCost,
        currency: parsed.currency ?? "USD",
        category: parsed.flights.length ? "flights" : parsed.documentType === "hotel" ? "lodging" : "other",
        label,
      });
    }

    if (!d.destination) {
      setStep("destination");
      pushAssistantStep("No problem — where are you headed?");
      return;
    }
    if (!gotDuration) {
      setStep("duration");
      pushAssistantStep(`Got it, ${d.destination} it is. How long is the trip?`, DURATION_OPTIONS.map((o) => o.label));
      return;
    }
    if (!parsed.travelers) {
      setStep("travelers");
      pushAssistantStep("Who's traveling?", TRAVELER_OPTIONS.map((o) => o.label));
      return;
    }
    setStep("interests");
    pushAssistantStep(
      "What do you want more of on this trip? Pick as many as you like, then hit Continue.",
      INTEREST_OPTIONS.map((o) => o.label),
      true
    );
  }, [pushAssistantStep]);

  const submitFreeText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      pushUser(trimmed);

      if (step === "destination") {
        draftRef.current.destination = trimmed;
        setStep("duration");
        pushAssistantStep(`${trimmed} is a great choice. How long is the trip?`, DURATION_OPTIONS.map((o) => o.label));
        return;
      }

      if (step === "budget") {
        const parsed = Number(trimmed.replace(/[^0-9.]/g, ""));
        draftRef.current.budget = Number.isFinite(parsed) && parsed > 0 ? parsed : draftRef.current.budget;
        setStep("pace");
        pushAssistantStep("Got it. Last thing — how packed do you want each day to be?", PACE_OPTIONS.map((o) => o.label));
        return;
      }

      // Free text fallback for any other step just re-prompts.
      pushAssistant("Got it — you can also tap one of the options below.");
    },
    [step, pushAssistant, pushAssistantStep, pushUser]
  );

  const submitQuickReply = useCallback(
    (label: string) => {
      pushUser(label);

      if (label === "Try again") {
        runGeneration();
        return;
      }

      if (label === "Use these details") {
        applyExtractionAndAdvance();
        return;
      }

      if (label === "Start fresh instead") {
        pendingExtractionRef.current = null;
        const prompt = lastStepPromptRef.current;
        pushAssistant("No worries — let's pick up where we left off.", undefined, false, 300);
        window.setTimeout(() => pushAssistant(prompt.text, prompt.quickReplies, prompt.multiSelect), 350);
        return;
      }

      if (step === "duration") {
        const match = DURATION_OPTIONS.find((o) => o.label === label);
        draftRef.current.days = match?.days ?? 5;
        setStep("travelers");
        pushAssistantStep("Who's traveling?", TRAVELER_OPTIONS.map((o) => o.label));
        return;
      }

      if (step === "travelers") {
        const match = TRAVELER_OPTIONS.find((o) => o.label === label);
        draftRef.current.travelers = match?.count ?? 1;
        setStep("interests");
        pushAssistantStep(
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
        pushAssistantStep("Got it. Last thing — how packed do you want each day to be?", PACE_OPTIONS.map((o) => o.label));
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
    [step, pushAssistant, pushAssistantStep, pushUser, runGeneration, applyExtractionAndAdvance]
  );

  const submitMultiSelect = useCallback(
    (labels: string[]) => {
      pushUser(labels.length ? labels.join(", ") : "Surprise me");
      const selected = INTEREST_OPTIONS.filter((o) => labels.includes(o.label)).map((o) => o.value);
      draftRef.current.interests = selected.length ? selected : ["culture", "food"];
      setStep("budget");
      pushAssistantStep("What's your budget vibe for this trip?", BUDGET_OPTIONS.map((o) => o.label));
    },
    [pushAssistantStep, pushUser]
  );

  const uploadDocuments = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      const capped = files.slice(0, MAX_UPLOAD_FILES);
      pushUser(`📎 ${capped.map((f) => f.name).join(", ")}`);
      setIsTyping(true);
      try {
        const uploaded = await Promise.all(capped.map(readUploadedDocument));
        const { parsed, error } = await parseTravelDocuments(uploaded);
        setIsTyping(false);

        if (!parsed) {
          setMessages((prev) => [
            ...prev,
            makeMessage("assistant", error ?? "I couldn't read those files — mind trying clearer photos or different files?"),
          ]);
          return;
        }

        pendingExtractionRef.current = parsed;
        setMessages((prev) => [
          ...prev,
          makeMessage("assistant", formatExtractionRecap(parsed), ["Use these details", "Start fresh instead"]),
        ]);
      } catch {
        setIsTyping(false);
        setMessages((prev) => [...prev, makeMessage("assistant", "Something went wrong reading those files — mind trying again?")]);
      }
    },
    [pushUser]
  );

  return {
    messages,
    step,
    isTyping,
    generatedItinerary,
    itinerarySource,
    pendingExpense,
    draft: draftRef.current,
    interestOptions: INTEREST_OPTIONS,
    submitFreeText,
    submitQuickReply,
    submitMultiSelect,
    uploadDocuments,
  };
}
