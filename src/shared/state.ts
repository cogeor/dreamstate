import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getDreamstateDir, ensureDreamstateDir } from './config.js';
import type { ProjectState } from './types.js';

const STATE_FILE = 'STATE.md';
const MAX_ACTIVITIES = 10;

export function getStatePath(workspaceRoot: string): string {
  return join(getDreamstateDir(workspaceRoot), STATE_FILE);
}

export function loadState(workspaceRoot: string): ProjectState | null {
  const path = getStatePath(workspaceRoot);
  if (!existsSync(path)) return null;

  try {
    const content = readFileSync(path, 'utf-8');
    return parseStateMd(content);
  } catch {
    return null;
  }
}

export function saveState(workspaceRoot: string, state: ProjectState): void {
  ensureDreamstateDir(workspaceRoot);
  const path = getStatePath(workspaceRoot);
  const content = formatStateMd(state);
  writeFileSync(path, content);
}

export function addActivity(
  workspaceRoot: string,
  description: string,
  focus?: string
): ProjectState {
  const existing = loadState(workspaceRoot) || createDefaultState();

  const activity = {
    date: new Date().toISOString(),
    description,
  };

  // Add to front, keep only MAX_ACTIVITIES
  existing.recentActivity = [activity, ...existing.recentActivity].slice(0, MAX_ACTIVITIES);
  existing.lastUpdated = new Date().toISOString();

  if (focus) {
    existing.currentFocus = focus;
  }

  saveState(workspaceRoot, existing);
  return existing;
}

export function createDefaultState(): ProjectState {
  return {
    lastUpdated: new Date().toISOString(),
    currentFocus: 'Not set',
    recentActivity: [],
    openItems: [],
    proposedNextSteps: [],
  };
}

function parseStateMd(content: string): ProjectState {
  const state = createDefaultState();

  // Parse Current Focus
  const focusMatch = content.match(/## Current Focus\n\n([^\n#]+)/);
  if (focusMatch) {
    state.currentFocus = focusMatch[1].trim();
  }

  // Parse Recent Activity
  const activityMatch = content.match(/## Recent Activity\n\n([\s\S]*?)(?=\n## |$)/);
  if (activityMatch) {
    const lines = activityMatch[1].trim().split('\n').filter(l => l.startsWith('- '));
    state.recentActivity = lines.map(line => {
      const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
      if (match) {
        return { date: match[1], description: match[2] };
      }
      return { date: new Date().toISOString(), description: line.replace(/^- /, '') };
    });
  }

  // Parse Open Items
  const openMatch = content.match(/## Open Items\n\n([\s\S]*?)(?=\n## |$)/);
  if (openMatch) {
    state.openItems = openMatch[1].trim().split('\n')
      .filter(l => l.startsWith('- '))
      .map(l => l.replace(/^- /, ''));
  }

  // Parse Next Steps
  const nextMatch = content.match(/## Proposed Next Steps\n\n([\s\S]*?)(?=\n## |$)/);
  if (nextMatch) {
    state.proposedNextSteps = nextMatch[1].trim().split('\n')
      .filter(l => l.match(/^\d+\./))
      .map(l => l.replace(/^\d+\.\s*/, ''));
  }

  // Parse last updated
  const updatedMatch = content.match(/Last Updated: (.+)/);
  if (updatedMatch) {
    state.lastUpdated = updatedMatch[1].trim();
  }

  return state;
}

function formatStateMd(state: ProjectState): string {
  const activities = state.recentActivity
    .map(a => `- **${a.date.split('T')[0]}**: ${a.description}`)
    .join('\n');

  const openItems = state.openItems.length > 0
    ? state.openItems.map(i => `- ${i}`).join('\n')
    : '- None';

  const nextSteps = state.proposedNextSteps.length > 0
    ? state.proposedNextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '1. Review current state and set next focus';

  return `# Project State

Last Updated: ${state.lastUpdated}

## Current Focus

${state.currentFocus}

## Recent Activity

${activities || '- No recent activity'}

## Open Items

${openItems}

## Proposed Next Steps

${nextSteps}
`;
}
