import chokidar from 'chokidar';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Config, Task, FileTask } from '../shared/types.js';

// Regex to match @delegate directives
// Supports: // @delegate: instruction
//           # @delegate: instruction
//           /* @delegate: instruction */
const DIRECTIVE_REGEX = /@delegate:\s*(.+?)(?:\s*\*\/)?$/;

export interface FileWatcherEvents {
  onFileChange: (task: Task) => void;
  onFileDirective?: (task: FileTask) => void;
}

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private workspaceRoot: string;
  private config: Config;
  private events: FileWatcherEvents;

  constructor(workspaceRoot: string, config: Config, events: FileWatcherEvents) {
    this.workspaceRoot = workspaceRoot;
    this.config = config;
    this.events = events;
  }

  start(): void {
    const patterns = this.config.watch.patterns.map(p =>
      join(this.workspaceRoot, p)
    );

    this.watcher = chokidar.watch(patterns, {
      ignored: [
        ...this.config.watch.ignore.map(p => `**/${p}/**`),
        /(^|[\/\\])\../  // Ignore dotfiles
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });

    this.watcher.on('change', (filePath: string) => {
      // Check for @delegate directives
      const directives = this.scanForDirectives(filePath);
      if (directives.length > 0 && this.events.onFileDirective) {
        for (const directive of directives) {
          this.events.onFileDirective(directive);
        }
      }

      // Also emit general file change
      const task: Task = {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'file-change',
        payload: { filePath },
        createdAt: new Date().toISOString()
      };
      this.events.onFileChange(task);
    });

    this.watcher.on('error', (error: Error) => {
      console.error('[FileWatcher] Error:', error.message);
    });

    console.log(`[FileWatcher] Watching patterns: ${this.config.watch.patterns.join(', ')}`);
    console.log(`[FileWatcher] Ignoring: ${this.config.watch.ignore.join(', ')}`);
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('[FileWatcher] Stopped');
    }
  }

  getWatchedPaths(): string[] {
    return this.config.watch.patterns;
  }

  /**
   * Scan a file for @delegate directives
   */
  private scanForDirectives(filePath: string): FileTask[] {
    const directives: FileTask[] = [];

    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(DIRECTIVE_REGEX);

        if (match) {
          const instruction = match[1].trim();
          directives.push({
            id: `directive-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'file-directive',
            filePath,
            directive: line.trim(),
            instruction,
            lineNumber: i + 1,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error(`[FileWatcher] Error scanning ${filePath}:`, err);
    }

    if (directives.length > 0) {
      console.log(`[FileWatcher] Found ${directives.length} directive(s) in ${filePath}`);
    }

    return directives;
  }
}
