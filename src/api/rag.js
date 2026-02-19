import { ragFetch } from './client';
import { scanConfig } from '../config/scan.config';

export async function ragLookup({ query_key, description, context, expected_io }) {
  return ragFetch({
    query_key,
    description: description || '',
    context: context || {},
    expected_io: expected_io || {},
    top_k: scanConfig.topK,
  });
}
