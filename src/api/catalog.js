import { apiPaths } from '../config/api.config';

/**
 * Fetch the full API catalog from GET /catalog.
 * Uses relative path so Vite proxy works in dev.
 * @returns {{ apis: Array, _meta?: object }}
 */
export async function fetchCatalog() {
  const url = apiPaths.catalog;
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(res.statusText || 'Catalog unavailable');
    err.status = res.status;
    err.body = await res.text();
    throw err;
  }
  const data = await res.json();
  return {
    apis: data.apis || [],
    _meta: data._meta,
  };
}
