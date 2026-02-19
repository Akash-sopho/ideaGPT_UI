import { llmFetch } from './client';
import { apiPaths } from '../config/api.config';
import { appConfig } from '../config/app.config';

export async function suggestPersonas({ idea, ideaSummary, selectedFeatures, selectedFeatureDescriptions }) {
  const body = {
    idea: idea.trim(),
    idea_summary: ideaSummary || '',
    selected_features: selectedFeatures || [],
    min_personas: appConfig.minPersonas,
    max_personas: appConfig.maxPersonas,
  };
  if (selectedFeatureDescriptions?.length) {
    body.selected_feature_descriptions = selectedFeatureDescriptions.map(({ title, description }) => ({
      title: title || '',
      description: description ?? '',
    }));
  }
  return llmFetch(apiPaths.suggestPersonas, body);
}
