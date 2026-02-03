#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, copyFileSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pluginRoot = resolve(__dirname, '..');

const command = process.argv[2];
const claudeDir = join(homedir(), '.claude');

function printUsage() {
  console.log(`delegate-claude - install/uninstall the delegate plugin for Claude Code

Usage:
  delegate-claude install    Install commands, agents, and hooks into ~/.claude/
  delegate-claude uninstall  Remove delegate files from ~/.claude/
  delegate-claude path       Print the plugin root path`);
}

/**
 * Read and parse settings.json, returning empty object if missing/invalid
 */
function readSettings(settingsPath) {
  if (existsSync(settingsPath)) {
    try {
      return JSON.parse(readFileSync(settingsPath, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Build a hook command with forward slashes for cross-platform compatibility
 */
function buildHookCommand(hookName) {
  const hookPath = join(pluginRoot, 'dist', 'hooks', hookName).replace(/\\/g, '/');
  return `node "${hookPath}"`;
}

function install() {
  console.log(`[delegate] Plugin root: ${pluginRoot}`);
  console.log(`[delegate] Target: ${claudeDir}`);
  console.log();

  // 1. Copy commands/dg/ -> ~/.claude/commands/dg/
  const commandsSrc = join(pluginRoot, 'commands', 'dg');
  const commandsDest = join(claudeDir, 'commands', 'dg');

  if (existsSync(commandsDest)) {
    rmSync(commandsDest, { recursive: true });
  }
  mkdirSync(commandsDest, { recursive: true });

  const commandFiles = readdirSync(commandsSrc).filter(f => f.endsWith('.md'));
  for (const file of commandFiles) {
    copyFileSync(join(commandsSrc, file), join(commandsDest, file));
  }
  console.log(`  ✓ Installed ${commandFiles.length} commands to commands/dg/`);

  // 2. Copy agents/dg-*.md -> ~/.claude/agents/
  const agentsSrc = join(pluginRoot, 'agents');
  const agentsDest = join(claudeDir, 'agents');
  mkdirSync(agentsDest, { recursive: true });

  // Remove old dg- agents first
  if (existsSync(agentsDest)) {
    for (const file of readdirSync(agentsDest)) {
      if (file.startsWith('dg-') && file.endsWith('.md')) {
        rmSync(join(agentsDest, file));
      }
    }
  }

  const agentFiles = readdirSync(agentsSrc).filter(f => f.startsWith('dg-') && f.endsWith('.md'));
  for (const file of agentFiles) {
    copyFileSync(join(agentsSrc, file), join(agentsDest, file));
  }
  console.log(`  ✓ Installed ${agentFiles.length} agents`);

  // 3. Register hooks in ~/.claude/settings.json
  //    Hooks point to dist/ in the source repo (not copied)
  const settingsPath = join(claudeDir, 'settings.json');
  const settings = readSettings(settingsPath);

  if (!settings.hooks) {
    settings.hooks = {};
  }

  const hookEvents = {
    SessionStart: buildHookCommand('session-start.js'),
    UserPromptSubmit: buildHookCommand('prompt-submit.js'),
    SessionEnd: buildHookCommand('session-end.js'),
  };

  for (const [event, cmd] of Object.entries(hookEvents)) {
    if (!settings.hooks[event]) {
      settings.hooks[event] = [];
    }

    // Remove any existing delegate hooks
    settings.hooks[event] = settings.hooks[event].filter(entry => {
      if (entry.hooks && Array.isArray(entry.hooks)) {
        return !entry.hooks.some(h => h.command && h.command.includes('delegate'));
      }
      return true;
    });

    // Add our hook
    settings.hooks[event].push({
      hooks: [{ type: 'command', command: cmd }],
    });
  }

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  console.log(`  ✓ Registered hooks in settings.json`);

  console.log();
  console.log(`Done! Restart Claude Code and run /dg:status to verify.`);
}

function uninstall() {
  console.log(`[delegate] Removing from ${claudeDir}`);
  console.log();

  // 1. Remove commands/dg/
  const commandsDest = join(claudeDir, 'commands', 'dg');
  if (existsSync(commandsDest)) {
    rmSync(commandsDest, { recursive: true });
    console.log(`  ✓ Removed commands/dg/`);
  }

  // 2. Remove dg-* agents
  const agentsDest = join(claudeDir, 'agents');
  if (existsSync(agentsDest)) {
    let count = 0;
    for (const file of readdirSync(agentsDest)) {
      if (file.startsWith('dg-') && file.endsWith('.md')) {
        rmSync(join(agentsDest, file));
        count++;
      }
    }
    if (count > 0) {
      console.log(`  ✓ Removed ${count} agents`);
    }
  }

  // 3. Remove delegate hooks from settings.json
  const settingsPath = join(claudeDir, 'settings.json');
  if (existsSync(settingsPath)) {
    const settings = readSettings(settingsPath);

    if (settings.hooks) {
      let cleaned = false;
      for (const event of Object.keys(settings.hooks)) {
        const before = settings.hooks[event].length;
        settings.hooks[event] = settings.hooks[event].filter(entry => {
          if (entry.hooks && Array.isArray(entry.hooks)) {
            return !entry.hooks.some(h => h.command && h.command.includes('delegate'));
          }
          return true;
        });
        if (settings.hooks[event].length < before) cleaned = true;
        if (settings.hooks[event].length === 0) delete settings.hooks[event];
      }
      if (Object.keys(settings.hooks).length === 0) delete settings.hooks;

      if (cleaned) {
        writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
        console.log(`  ✓ Removed hooks from settings.json`);
      }
    }
  }

  console.log();
  console.log('Done! Delegate has been uninstalled.');
}

function printPath() {
  console.log(pluginRoot);
}

switch (command) {
  case 'install':
    install();
    break;
  case 'uninstall':
    uninstall();
    break;
  case 'path':
    printPath();
    break;
  default:
    printUsage();
    break;
}
