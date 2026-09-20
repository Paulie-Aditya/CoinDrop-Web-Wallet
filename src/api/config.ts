// Some env-var UIs (e.g. Vercel's dashboard) store the value verbatim, quotes
// and all, if it's pasted straight from a .env-style "VITE_API_URL=\"...\"" —
// dotenv would strip those quotes, the dashboard won't. Strip them ourselves
// so a copy-paste mistake can't silently turn into a broken relative URL.
export const API_URL = (import.meta.env.VITE_API_URL ?? "")
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/\/$/, "");

/** Mock mode: fake data + fake Discord login, no backend required.
 *  `.env.production` forces this off for `vite build`; this is a last-resort
 *  guard in case that's overridden. */
export const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === "true" && !import.meta.env.PROD;

// In production VITE_API_URL points at the Flask backend (e.g. https://backend.coindrop.cc);
// an empty value falls back to same-origin relative requests.
if (import.meta.env.PROD && import.meta.env.VITE_USE_MOCK === "true") {
  console.warn("[coindrop] VITE_USE_MOCK is ignored in production builds.");
}
