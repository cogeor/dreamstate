import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getDreamstateDir } from '../shared/config.js';
import type { DreamState } from '../shared/types.js';

const DREAM_STATE_FILE = 'dream.state';
const ACTIVITY_FILE = 'last-activity.txt';

export interface DreamDetectorConfig {
  dreamTimeoutMinutes: number;
  model: string;
  onDreamStart?: () => void;
  onDreamEnd?: () => void;
}

export class DreamDetector {
  private workspaceRoot: string;
  private config: DreamDetectorConfig;
  private lastActivityTime: number;
  private isDreaming: boolean = false;
  private checkIntervalId: NodeJS.Timeout | null = null;

  constructor(workspaceRoot: string, config: DreamDetectorConfig) {
    this.workspaceRoot = workspaceRoot;
    this.config = config;
    this.lastActivityTime = Date.now();
    this.loadLastActivity();
  }

  private getActivityPath(): string {
    return join(getDreamstateDir(this.workspaceRoot), ACTIVITY_FILE);
  }

  private getDreamStatePath(): string {
    return join(getDreamstateDir(this.workspaceRoot), DREAM_STATE_FILE);
  }

  private loadLastActivity(): void {
    const path = this.getActivityPath();
    if (existsSync(path)) {
      try {
        const timestamp = parseInt(readFileSync(path, 'utf-8').trim(), 10);
        if (!isNaN(timestamp)) {
          this.lastActivityTime = timestamp;
        }
      } catch {
        // Ignore errors, use current time
      }
    }
  }

  /**
   * Record activity (call this when user does something)
   */
  recordActivity(): void {
    this.lastActivityTime = Date.now();
    writeFileSync(this.getActivityPath(), String(this.lastActivityTime));

    // If we were dreaming, transition out
    if (this.isDreaming) {
      this.isDreaming = false;
      console.log('[DreamDetector] Activity detected, exiting dream state');
      this.config.onDreamEnd?.();
    }
  }

  /**
   * Check if system is idle (no activity for N minutes)
   */
  checkIdle(): boolean {
    const idleMs = this.config.dreamTimeoutMinutes * 60 * 1000;
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    return timeSinceActivity >= idleMs;
  }

  /**
   * Get current dream state from file
   */
  getDreamState(): DreamState | null {
    const path = this.getDreamStatePath();
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as DreamState;
    } catch {
      return null;
    }
  }

  /**
   * Check if dream mode is manually active (via /ds:dream)
   */
  isManualDreamActive(): boolean {
    const state = this.getDreamState();
    return state?.active === true;
  }

  /**
   * Get minutes until dream triggers (or 0 if already idle)
   */
  getMinutesUntilDream(): number {
    const idleMs = this.config.dreamTimeoutMinutes * 60 * 1000;
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    const remaining = idleMs - timeSinceActivity;
    return Math.max(0, Math.ceil(remaining / 60000));
  }

  /**
   * Get time since last activity in minutes
   */
  getIdleMinutes(): number {
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    return Math.floor(timeSinceActivity / 60000);
  }

  /**
   * Start periodic idle checking
   */
  start(): void {
    // Check every 30 seconds
    this.checkIntervalId = setInterval(() => {
      if (this.checkIdle() && !this.isDreaming && !this.isManualDreamActive()) {
        this.isDreaming = true;
        console.log(`[DreamDetector] System idle for ${this.config.dreamTimeoutMinutes} minutes`);
        this.config.onDreamStart?.();
      }
    }, 30000);

    console.log(`[DreamDetector] Started (timeout: ${this.config.dreamTimeoutMinutes} minutes)`);
  }

  /**
   * Stop idle checking
   */
  stop(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    console.log('[DreamDetector] Stopped');
  }
}
