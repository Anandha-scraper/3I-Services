/**
 * Empty VITE_API_URL: same-origin `/api/...` (Vite proxy in dev, Express in prod).
 * Otherwise set full origin, e.g. http://localhost:5000 (no trailing slash, no /api).
 */
export function apiUrl(path) {
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

/**
 * Fetch wrapper that always sends cookies (credentials: 'include').
 * Fires a global 'auth:unauthorized' event on 401 so AuthContext can auto-logout.
 */
export async function apiFetch(path, options = {}) {
  const res = await fetch(apiUrl(path), { credentials: 'include', ...options });
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
  return res;
}
