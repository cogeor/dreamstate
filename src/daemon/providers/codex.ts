/**
 * Codex CLI provider stub.
 * TODO: Implement when Codex CLI interface is documented.
 */

import { spawnSync } from 'child_process';
import type { LLMProvider, LLMOptions, LLMResult, ModelInfo } from './types.js';

const CODEX_MODELS: ModelInfo[] = [
  { id: 'codex-mini', name: 'Codex Mini', tier: 'fast', tokenEstimate: 2000 },
  { id: 'codex', name: 'Codex', tier: 'balanced', tokenEstimate: 4000 },
  { id: 'codex-large', name: 'Codex Large', tier: 'powerful', tokenEstimate: 8000 },
];

export class CodexProvider implements LLMProvider {
  name = 'codex' as const;

  async run(_prompt: string, _options: LLMOptions): Promise<LLMResult> {
    // TODO: Implement Codex CLI integration
    // Expected CLI: codex [flags] <prompt>
    // Research needed: CLI flags for model selection and print mode
    return {
      success: false,
      output: '',
      error: 'Codex provider not yet implemented. See src/daemon/providers/codex.ts',
    };
  }

  getModels(): ModelInfo[] {
    return CODEX_MODELS;
  }

  estimateTokens(model: string, complexity: 'low' | 'medium' | 'high' = 'medium'): number {
    const multipliers = { low: 0.5, medium: 1.0, high: 2.0 };
    const modelInfo = CODEX_MODELS.find(m => m.id === model);
    const baseEstimate = modelInfo?.tokenEstimate ?? 2000;
    return Math.round(baseEstimate * multipliers[complexity]);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const result = spawnSync('codex', ['--version'], {
        shell: true,
        timeout: 5000,
        encoding: 'utf-8',
      });
      return result.status === 0;
    } catch {
      return false;
    }
  }
}
