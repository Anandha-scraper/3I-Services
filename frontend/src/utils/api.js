/**
 * Empty VITE_API_URL: same-origin `/api/...` (Vite proxy in dev, Express in prod).
 * Otherwise set full origin, e.g. http://localhost:5000 (no trailing slash, no /api).
 */
export function apiUrl(path) {
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
