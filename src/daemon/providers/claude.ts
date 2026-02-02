/**
 * Claude Code provider implementation.
 * Wraps the `claude` CLI for LLM operations.
 */

import { spawn, spawnSync } from 'child_process';
import type { LLMProvider, LLMOptions, LLMResult, ModelInfo } from './types.js';

const CLAUDE_MODELS: ModelInfo[] = [
  { id: 'haiku', name: 'Claude Haiku', tier: 'fast', tokenEstimate: 2000 },
  { id: 'sonnet', name: 'Claude Sonnet', tier: 'balanced', tokenEstimate: 4000 },
  { id: 'opus', name: 'Claude Opus', tier: 'powerful', tokenEstimate: 8000 },
];

const TOKEN_MULTIPLIERS = {
  low: 0.5,
  medium: 1.0,
  high: 2.0,
};

export class ClaudeProvider implements LLMProvider {
  name = 'claude' as const;

  async run(prompt: string, options: LLMOptions): Promise<LLMResult> {
    const {
      model = 'haiku',
      workingDir = process.cwd(),
      timeout = 120000,
    } = options;

    return new Promise((resolve) => {
      const args = ['--print', '--model', model, prompt];

      console.log(`[Claude] Running with model: ${model}`);

      const proc = spawn('claude', args, {
        cwd: workingDir,
        shell: true,
        timeout,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('error', (err) => {
        resolve({
          success: false,
          output: '',
          error: `Failed to spawn claude: ${err.message}`,
        });
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: stdout.trim(),
            tokensUsed: this.estimateTokens(model),
          });
        } else {
          resolve({
            success: false,
            output: stdout.trim(),
            error: stderr.trim() || `Process exited with code ${code}`,
          });
        }
      });

      // Handle timeout
      setTimeout(() => {
        proc.kill('SIGTERM');
        resolve({
          success: false,
          output: stdout.trim(),
          error: 'Process timed out',
        });
      }, timeout);
    });
  }

  getModels(): ModelInfo[] {
    return CLAUDE_MODELS;
  }

  estimateTokens(model: string, complexity: 'low' | 'medium' | 'high' = 'medium'): number {
    const modelInfo = CLAUDE_MODELS.find(m => m.id === model);
    const baseEstimate = modelInfo?.tokenEstimate ?? 2000;
    return Math.round(baseEstimate * TOKEN_MULTIPLIERS[complexity]);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const result = spawnSync('claude', ['--version'], {
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
