/**
 * LLM Provider abstraction layer.
 * Enables support for multiple coding assistants (Claude Code, OpenCode, Codex).
 */

export interface LLMProvider {
  /** Provider identifier */
  name: ProviderName;

  /** Run a prompt and get response */
  run(prompt: string, options: LLMOptions): Promise<LLMResult>;

  /** Get available models for this provider */
  getModels(): ModelInfo[];

  /** Estimate tokens for a model and complexity level */
  estimateTokens(model: string, complexity?: 'low' | 'medium' | 'high'): number;

  /** Check if the provider CLI is available */
  isAvailable(): Promise<boolean>;
}

export interface LLMOptions {
  /** Model to use (provider-specific) */
  model: string;
  /** Working directory for CLI execution */
  workingDir?: string;
  /** Timeout in milliseconds */
  timeout?: number;
}

export interface LLMResult {
  success: boolean;
  output: string;
  error?: string;
  tokensUsed?: number;
}

export interface ModelInfo {
  /** Model identifier (e.g., 'haiku', 'gpt-4o-mini') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Performance tier */
  tier: 'fast' | 'balanced' | 'powerful';
  /** Default token estimate per operation */
  tokenEstimate: number;
}

export type ProviderName = 'claude' | 'opencode' | 'codex';
