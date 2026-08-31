import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { PlannerPage } from "./pages/PlannerPage";
import { TripsPage } from "./pages/TripsPage";
import { TripDetailPage } from "./pages/TripDetailPage";
import { TemplatesPage } from "./pages/TemplatesPage";

function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<PlannerPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/:tripId" element={<TripDetailPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
