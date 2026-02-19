/**
 * Environment config. Reads from import.meta.env (Vite).
 * Validates required vars in production; no API keys in frontend.
 */
const env = typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env
  : typeof process !== 'undefined' && process.env
    ? process.env
    : {};

const LLM_SERVICE_URL = env.VITE_LLM_SERVICE_URL || env.REACT_APP_LLM_SERVICE_URL || '';
const RAG_SERVICE_URL = env.VITE_RAG_SERVICE_URL || env.REACT_APP_RAG_SERVICE_URL || '';

const isProd = (env.MODE || env.NODE_ENV) === 'production';
if (isProd && (!LLM_SERVICE_URL || !RAG_SERVICE_URL)) {
  console.error('IdeaGPT: VITE_LLM_SERVICE_URL and VITE_RAG_SERVICE_URL are required in production.');
}

export {
  LLM_SERVICE_URL,
  RAG_SERVICE_URL,
};
