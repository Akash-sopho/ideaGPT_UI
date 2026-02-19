import { llmFetch } from './client';
import { apiPaths } from '../config/api.config';

/**
 * Get suggested input/output for one step from context (direct LLM, no RAG).
 * @param {{ idea: string, persona_label: string, journey_title: string, step_label: string, api_key: string }} payload
 */
export async function getStepIO(payload) {
  return llmFetch(apiPaths.stepIo, {
    idea: payload.idea,
    persona_label: payload.persona_label,
    journey_title: payload.journey_title,
    step_label: payload.step_label,
    api_key: payload.api_key,
  });
}
