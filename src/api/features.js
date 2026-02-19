import { llmFetch } from './client';
import { apiPaths } from '../config/api.config';
import { appConfig } from '../config/app.config';

export async function fetchFeatures(idea) {
  return llmFetch(apiPaths.features, {
    idea: idea.trim(),
    min_features: appConfig.minFeatures,
    max_features: appConfig.maxFeatures,
  });
}
