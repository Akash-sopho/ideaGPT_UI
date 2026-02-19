import { llmFetch } from './client';
import { apiPaths } from '../config/api.config';

/**
 * Send one chat turn to the discovery coach. Pass full message history.
 * @param {{ messages: Array<{ role: 'user' | 'assistant', content: string }>, idea_context?: string }} opts
 */
export async function sendChat({ messages, idea_context = '' }) {
  return llmFetch(apiPaths.chat, {
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    idea_context: (idea_context || '').trim(),
  });
}

/**
 * Summarise the conversation into a structured brief. Does not call /llm/features.
 * @param {{ messages: Array<{ role: 'user' | 'assistant', content: string }> }} opts
 */
export async function summariseIdea({ messages }) {
  return llmFetch(apiPaths.summarise, {
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
}
