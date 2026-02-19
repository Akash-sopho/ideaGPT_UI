import { LLM_SERVICE_URL, RAG_SERVICE_URL } from '../config/env';
import { apiPaths } from '../config/api.config';


function buildUrl(base, path) {
  const b = base.replace(/\/$/, '');
  const p = (path || '').replace(/^\//, '');
  return `${b}/${p}`;
}

export async function llmFetch(path, body) {
  const url = buildUrl(LLM_SERVICE_URL, path);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = new Error(res.statusText || 'LLM request failed');
    err.status = res.status;
    err.body = await res.text();
    throw err;
  }
  return res.json();
}

export async function ragFetch(body) {
  const url = buildUrl(RAG_SERVICE_URL, apiPaths.ragLookup);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = new Error(res.statusText || 'RAG request failed');
    err.status = res.status;
    err.body = await res.text();
    throw err;
  }
  return res.json();
}

export async function ragRerankFetch(body) {
  const url = buildUrl(RAG_SERVICE_URL, apiPaths.ragRerank);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = new Error(res.statusText || 'RAG rerank failed');
    err.status = res.status;
    err.body = await res.text();
    throw err;
  }
  return res.json();
}
