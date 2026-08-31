import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatPanel } from "../components/chat/ChatPanel";
import { ItineraryPreview } from "../components/itinerary/ItineraryPreview";
import { usePlannerChat } from "../hooks/usePlannerChat";
import { useTripStore } from "../store/useTripStore";
import { pickCoverImage } from "../data/coverImages";
import { newId } from "../utils/format";
import type { Trip } from "../types";

export function PlannerPage() {
  const chat = usePlannerChat();
  const addTrip = useTripStore((s) => s.addTrip);
  const navigate = useNavigate();
  const [savedTripId, setSavedTripId] = useState<string | null>(null);

  const handleSave = () => {
    if (!chat.generatedItinerary) return;
    const trip: Trip = {
      id: newId("trip"),
      destination: chat.draft.destination,
      coverImage: pickCoverImage(chat.draft.destination),
      startDate: chat.draft.startDate,
      endDate: null,
      travelers: chat.draft.travelers,
      budget: chat.draft.budget,
      pace: chat.draft.pace,
      interests: chat.draft.interests,
      itinerary: chat.generatedItinerary,
      createdAt: new Date().toISOString(),
      status: "planning",
    };
    addTrip(trip);
    setSavedTripId(trip.id);
    window.setTimeout(() => navigate(`/trips/${trip.id}`), 700);
  };

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 lg:h-[calc(100svh-65px)] lg:grid-cols-[1fr_1.15fr]">
      <div className="h-[70svh] border-b border-ink-100 lg:h-auto lg:border-b-0 lg:border-r">
        <ChatPanel chat={chat} />
      </div>
      <div className="min-h-[60svh] lg:min-h-0">
        <ItineraryPreview
          destination={chat.draft.destination}
          itinerary={chat.generatedItinerary}
          onSave={handleSave}
          saved={!!savedTripId}
        />
      </div>
    </div>
  );
}
