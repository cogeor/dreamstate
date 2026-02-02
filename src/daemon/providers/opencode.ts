/**
 * OpenCode provider stub.
 * TODO: Implement when OpenCode CLI interface is documented.
 */

import { spawnSync } from 'child_process';
import type { LLMProvider, LLMOptions, LLMResult, ModelInfo } from './types.js';

const OPENCODE_MODELS: ModelInfo[] = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tier: 'fast', tokenEstimate: 2000 },
  { id: 'gpt-4o', name: 'GPT-4o', tier: 'balanced', tokenEstimate: 4000 },
  { id: 'o1', name: 'O1', tier: 'powerful', tokenEstimate: 8000 },
];

export class OpenCodeProvider implements LLMProvider {
  name = 'opencode' as const;

  async run(_prompt: string, _options: LLMOptions): Promise<LLMResult> {
    // TODO: Implement OpenCode CLI integration
    // Expected CLI: opencode [flags] <prompt>
    // Research needed: CLI flags for model selection and print mode
    return {
      success: false,
      output: '',
      error: 'OpenCode provider not yet implemented. See src/daemon/providers/opencode.ts',
    };
  }

  getModels(): ModelInfo[] {
    return OPENCODE_MODELS;
  }

  estimateTokens(model: string, complexity: 'low' | 'medium' | 'high' = 'medium'): number {
    const multipliers = { low: 0.5, medium: 1.0, high: 2.0 };
    const modelInfo = OPENCODE_MODELS.find(m => m.id === model);
    const baseEstimate = modelInfo?.tokenEstimate ?? 2000;
    return Math.round(baseEstimate * multipliers[complexity]);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const result = spawnSync('opencode', ['--version'], {
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
