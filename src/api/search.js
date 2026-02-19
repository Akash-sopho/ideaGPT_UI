import { apiPaths } from '../config/api.config';

/**
 * Semantic API search via POST /search.
 * @param {string} query - Natural-language description of the API/capability needed (non-empty).
 * @returns {{ results: Array }} APIResult[] with api_id, name, description, score, match_type, etc.
 */
export async function searchApis(query) {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    throw new Error('Search query is required');
  }
  const url = apiPaths.search;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: trimmed }),
  });
  if (!res.ok) {
    const err = new Error(res.statusText || 'Search failed');
    err.status = res.status;
    err.body = await res.text();
    throw err;
  }
  const data = await res.json();
  return { results: data.results || [] };
}
