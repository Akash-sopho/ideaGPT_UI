import { llmFetch } from './client';
import { apiPaths } from '../config/api.config';

export async function generateJiraTicket(payload) {
  return llmFetch(apiPaths.jira, {
    api_key: payload.api_key,
    idea: payload.idea,
    affected_steps: payload.affected_steps || [],
    rag_gap_summary: payload.rag_gap_summary || '',
    rag_enhancements: payload.rag_enhancements || [],
    suggested_priority: payload.suggested_priority || 'P2',
  });
}
