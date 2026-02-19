/**
 * Scanning UX config: messages, batch size, timeouts.
 */
export const scanConfig = {
  loadingMessages: [
    'Connecting to API registry…',
    'Scanning enterprise endpoints…',
    'Matching workflow steps…',
    'Resolving contract versions…',
    'Computing coverage…',
    'Building sequence map…',
  ],
  batchSize: 10,
  ragTimeoutMs: 8000,
  topK: 3,
};
