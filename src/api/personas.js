import { llmFetch } from './client';
import { apiPaths } from '../config/api.config';
import { appConfig } from '../config/app.config';

export async function suggestPersonas({ idea, ideaSummary, selectedFeatures }) {
  return llmFetch(apiPaths.suggestPersonas, {
    idea: idea.trim(),
    idea_summary: ideaSummary || '',
    selected_features: selectedFeatures || [],
    min_personas: appConfig.minPersonas,
    max_personas: appConfig.maxPersonas,
  });
}
