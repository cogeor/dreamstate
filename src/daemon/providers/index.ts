/**
 * LLM Provider factory and exports.
 */

export * from './types.js';
export { ClaudeProvider } from './claude.js';
export { OpenCodeProvider } from './opencode.js';
export { CodexProvider } from './codex.js';

import type { LLMProvider, ProviderName } from './types.js';
import { ClaudeProvider } from './claude.js';
import { OpenCodeProvider } from './opencode.js';
import { CodexProvider } from './codex.js';

/**
 * Create a provider by name.
 */
export function createProvider(name: ProviderName): LLMProvider {
  switch (name) {
    case 'claude':
      return new ClaudeProvider();
    case 'opencode':
      return new OpenCodeProvider();
    case 'codex':
      return new CodexProvider();
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

/**
 * Auto-detect available provider.
 * Checks in order: claude, opencode, codex.
 * Returns claude as fallback if none detected.
 */
export async function detectProvider(): Promise<LLMProvider> {
  const providers: LLMProvider[] = [
    new ClaudeProvider(),
    new OpenCodeProvider(),
    new CodexProvider(),
  ];

  for (const provider of providers) {
    if (await provider.isAvailable()) {
      console.log(`[Provider] Auto-detected: ${provider.name}`);
      return provider;
    }
  }

  // Fallback to Claude (most common case)
  console.log('[Provider] No CLI detected, defaulting to claude');
  return new ClaudeProvider();
}

/**
 * Get provider, with auto-detection support.
 */
export async function getProvider(name: ProviderName | 'auto'): Promise<LLMProvider> {
  if (name === 'auto') {
    return detectProvider();
  }
  return createProvider(name);
}
