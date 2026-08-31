/**
 * Base URL to prefix every /api/... call with. Empty by default, meaning
 * "same origin as the page" — correct when the Express server also serves
 * the built frontend (e.g. the Render deployment).
 *
 * On a static-only deployment (e.g. GitHub Pages) there is no server on
 * that origin at all, so VITE_API_BASE can be set at build time to point
 * the frontend at a separately-hosted backend (see README's "Deploying"
 * section). The server's CORS config must allow that origin.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
