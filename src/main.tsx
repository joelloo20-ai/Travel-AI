import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";

// HashRouter (not BrowserRouter) so client-side routes work with zero
// server config on static hosts like GitHub Pages, which have no way to
// rewrite unknown paths back to index.html.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
