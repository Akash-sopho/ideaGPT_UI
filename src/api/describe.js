import { llmFetch } from './client';
import { apiPaths } from '../config/api.config';

export async function describeApiKey(payload) {
  return llmFetch(apiPaths.describe, {
    api_key: payload.api_key,
    idea: payload.idea,
    step_label: payload.step_label,
    persona_label: payload.persona_label,
    journey_title: payload.journey_title,
  });
}
