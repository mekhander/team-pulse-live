const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE = configuredBase || '';

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || '요청을 처리하지 못했습니다.');
  return body;
}

export function getSessionId() {
  return new URLSearchParams(window.location.search).get('s') || '';
}

export function getViewKey() {
  return new URLSearchParams(window.location.hash.slice(1)).get('key') || '';
}
