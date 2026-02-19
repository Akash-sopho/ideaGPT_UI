import { ragFetch, ragRerankFetch } from './client';
import { scanConfig } from '../config/scan.config';

export async function ragLookup({ query_key, description, context, expected_io }) {
  return ragFetch({
    query_key,
    description: description || '',
    context: context || {},
    expected_io: expected_io || {},
    top_k: scanConfig.topK ?? 50,
    min_score: scanConfig.minScore ?? 0.75,
  });
}

export async function ragRerank({ query_key, description, context, expected_io, additional_info, suggested_apis }) {
  return ragRerankFetch({
    query_key,
    description: description || '',
    context: context || {},
    expected_io: expected_io || {},
    additional_info: additional_info || '',
    suggested_apis: suggested_apis || [],
  });
}
