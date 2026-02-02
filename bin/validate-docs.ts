#!/usr/bin/env node
/**
 * LLM-based documentation validator for pre-commit hooks.
 *
 * Uses Claude with tools (Glob, Read) to validate that documentation
 * claims match the actual codebase.
 *
 * Exit codes:
 *   0 - All checks pass
 *   1 - Validation failed (discrepancies found)
 *   2 - Error running validator
 */

import { execSync, spawnSync } from 'child_process';
import { readFileSync } from 'fs';

const DOC_FILES = ['CLAUDE.md', 'ARCHITECTURE.md', 'WORKFLOW.md'];

function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=d', { encoding: 'utf-8' });
    return output.trim().split('\n').filter(f => f.length > 0);
  } catch {
    return [];
  }
}

function readFileOrNull(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

function buildValidationPrompt(docsContent: Map<string, string>, stagedFiles: string[]): string {
  let prompt = `You are a documentation validator with access to tools. Your task is to verify that documentation claims match the actual codebase.

## IMPORTANT: Use Tools to Verify

You MUST use tools to verify claims. Do NOT guess or assume - actually check:
- Use **Glob** to verify directories/files exist (e.g., \`src/plugin/references/*.md\`)
- Use **Read** to verify file contents match descriptions
- Use **Bash** with \`ls\` for directory listings if needed

## Staged Files (being committed)
${stagedFiles.join('\n') || '(none)'}

## Documentation to Validate

`;

  for (const [file, content] of docsContent) {
    prompt += `\n### ${file}\n\`\`\`\n${content}\n\`\`\`\n`;
  }

  prompt += `
## Validation Rules

1. **File paths**: Use Glob to verify paths mentioned in docs exist
2. **Directory structures**: Verify directories mentioned exist (don't fail for unlisted subdirectories)
3. **Agent names**: Verify agents listed have corresponding .md files in src/plugin/agents/
4. **Config options**: Read .dreamstate/config.json to verify documented options exist
5. **Hook descriptions**: Read bin/*.ts files to verify hook descriptions are accurate

## What NOT to Flag

- Standard npm commands like "npm install" - these are built-in, not custom scripts
- Missing subdirectories in structure diagrams - docs don't need to list every folder
- Minor formatting differences

## Process

1. Identify all verifiable claims in the documentation
2. Use Glob/Read/Bash to check each claim
3. Report any discrepancies found

## Output Format

After verification, output EXACTLY one of:

If all checks pass:
\`\`\`
RESULT: PASS
\`\`\`

If any check fails:
\`\`\`
RESULT: FAIL
- [file:line] Description of discrepancy
\`\`\`

Be thorough. Use tools to verify. Do not guess.`;

  return prompt;
}

function runClaudeValidation(prompt: string): { pass: boolean; output: string } {
  try {
    // Run claude with tools enabled via --tools flag
    // Pass prompt via stdin to avoid command line length limits
    const result = spawnSync('claude', [
      '--print',
      '--model', 'haiku',
      '--tools', 'Glob,Read,Bash'
    ], {
      input: prompt,
      encoding: 'utf-8',
      timeout: 180000, // 3 minute timeout (tools take longer)
      maxBuffer: 2 * 1024 * 1024,
      shell: true,
      cwd: process.cwd()
    });

    if (result.error) {
      return { pass: false, output: `Error running claude: ${result.error.message}` };
    }

    const output = result.stdout || '';
    const stderr = result.stderr || '';

    // Check for RESULT: PASS in output
    const pass = output.includes('RESULT: PASS');

    // If there's an error but no output, report the error
    if (!output && stderr) {
      return { pass: false, output: `Claude error: ${stderr}` };
    }

    return { pass, output };
  } catch (err) {
    return { pass: false, output: `Validation error: ${err}` };
  }
}

function main(): void {
  console.log('[validate-docs] Checking documentation...');

  const stagedFiles = getStagedFiles();

  // Skip if no staged files
  if (stagedFiles.length === 0) {
    console.log('[validate-docs] No staged files, skipping.');
    process.exit(0);
  }

  // Check if relevant files are staged
  const docFiles = stagedFiles.filter(f => DOC_FILES.includes(f));
  const sourceFiles = stagedFiles.filter(f =>
    (f.startsWith('src/') || f.startsWith('bin/')) &&
    (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.md'))
  );

  if (docFiles.length === 0 && sourceFiles.length === 0) {
    console.log('[validate-docs] No doc or source changes, skipping.');
    process.exit(0);
  }

  // Read documentation files
  const docsContent = new Map<string, string>();
  for (const docFile of DOC_FILES) {
    const content = readFileOrNull(docFile);
    if (content) {
      docsContent.set(docFile, content);
    }
  }

  if (docsContent.size === 0) {
    console.log('[validate-docs] No documentation files found, skipping.');
    process.exit(0);
  }

  const prompt = buildValidationPrompt(docsContent, stagedFiles);
  const { pass, output } = runClaudeValidation(prompt);

  if (pass) {
    console.log('[validate-docs] PASS - Documentation matches codebase');
    process.exit(0);
  } else {
    console.log('[validate-docs] FAIL - Documentation discrepancies found:');
    // Extract just the relevant part of output (after tool use)
    const resultMatch = output.match(/RESULT: FAIL[\s\S]*/);
    if (resultMatch) {
      console.log(resultMatch[0]);
    } else {
      console.log(output.slice(-2000)); // Last 2000 chars if no clear result
    }
    console.log('\nUse --no-verify to bypass, or fix the discrepancies.');
    process.exit(1);
  }
}

main();
