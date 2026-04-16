/** Backend origin without trailing slash. Override with VITE_API_URL (e.g. https://api.example.com). */
const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL;
const trimmed = typeof envUrl === 'string' ? envUrl.trim().replace(/\/$/, '') : '';
export const API_ORIGIN = trimmed || 'http://localhost:5000';
export const API_URL = `${API_ORIGIN}/api`;

/** Resolve stored avatar path (e.g. /uploads/...) or absolute URL for <img src>. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (url == null) return null;
  const u = String(url).trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('//')) return `https:${u}`;
  return `${API_ORIGIN}${u.startsWith('/') ? '' : '/'}${u}`;
}

/** Google profile photos often fail without this on <img> (Referer stripped). */
export const AVATAR_IMG_REFERRER_POLICY = 'no-referrer' as const;
