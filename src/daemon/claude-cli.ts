import { spawn } from 'child_process';
import type { Model } from '../shared/types.js';

export interface ClaudeCliOptions {
  model?: Model;
  maxTokens?: number;
  workingDir?: string;
  timeout?: number; // ms
}

export interface ClaudeCliResult {
  success: boolean;
  output: string;
  error?: string;
  tokensUsed?: number;
}

// Approximate token counts by model
const MODEL_TOKEN_ESTIMATES: Record<Model, number> = {
  haiku: 2000,
  sonnet: 4000,
  opus: 8000,
};

/**
 * Spawn claude CLI with a prompt
 */
export async function runClaude(
  prompt: string,
  options: ClaudeCliOptions = {}
): Promise<ClaudeCliResult> {
  const {
    model = 'haiku',
    workingDir = process.cwd(),
    timeout = 120000, // 2 minutes default
  } = options;

  return new Promise((resolve) => {
    const args = ['--print', '--model', model, prompt];

    console.log(`[ClaudeCLI] Running with model: ${model}`);

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
          tokensUsed: MODEL_TOKEN_ESTIMATES[model],
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

/**
 * Run claude with a specific agent
 */
export async function runClaudeAgent(
  agentName: string,
  prompt: string,
  options: ClaudeCliOptions = {}
): Promise<ClaudeCliResult> {
  const fullPrompt = `Use the ${agentName} agent to: ${prompt}`;
  return runClaude(fullPrompt, options);
}

/**
 * Estimate tokens for an operation based on model
 */
export function estimateTokens(model: Model): number {
  return MODEL_TOKEN_ESTIMATES[model];
}
