import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getDreamstateDir } from '../shared/config.js';
import type { IdleState } from '../shared/types.js';

const IDLE_STATE_FILE = 'idle.state';
const ACTIVITY_FILE = 'last-activity.txt';

export interface IdleDetectorConfig {
  idleTimeoutMinutes: number;
  model: string;
  onIdleStart?: () => void;
  onIdleEnd?: () => void;
}

export class IdleDetector {
  private workspaceRoot: string;
  private config: IdleDetectorConfig;
  private lastActivityTime: number;
  private isIdle: boolean = false;
  private checkIntervalId: NodeJS.Timeout | null = null;

  constructor(workspaceRoot: string, config: IdleDetectorConfig) {
    this.workspaceRoot = workspaceRoot;
    this.config = config;
    this.lastActivityTime = Date.now();
    this.loadLastActivity();
  }

  private getActivityPath(): string {
    return join(getDreamstateDir(this.workspaceRoot), ACTIVITY_FILE);
  }

  private getIdleStatePath(): string {
    return join(getDreamstateDir(this.workspaceRoot), IDLE_STATE_FILE);
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

    // If we were idle, transition out
    if (this.isIdle) {
      this.isIdle = false;
      console.log('[IdleDetector] Activity detected, exiting idle state');
      this.config.onIdleEnd?.();
    }
  }

  /**
   * Check if system is idle (no activity for N minutes)
   */
  checkIdle(): boolean {
    const idleMs = this.config.idleTimeoutMinutes * 60 * 1000;
    const timeSinceActivity = Date.now() - this.lastActivityTime;
    return timeSinceActivity >= idleMs;
  }

  /**
   * Get current idle state from file
   */
  getIdleState(): IdleState | null {
    const path = this.getIdleStatePath();
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as IdleState;
    } catch {
      return null;
    }
  }

  /**
   * Check if idle mode is manually active (via /ds:idle)
   */
  isManualIdleActive(): boolean {
    const state = this.getIdleState();
    return state?.active === true;
  }

  /**
   * Get minutes until idle triggers (or 0 if already idle)
   */
  getMinutesUntilIdle(): number {
    const idleMs = this.config.idleTimeoutMinutes * 60 * 1000;
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
      if (this.checkIdle() && !this.isIdle && !this.isManualIdleActive()) {
        this.isIdle = true;
        console.log(`[IdleDetector] System idle for ${this.config.idleTimeoutMinutes} minutes`);
        this.config.onIdleStart?.();
      }
    }, 30000);

    console.log(`[IdleDetector] Started (timeout: ${this.config.idleTimeoutMinutes} minutes)`);
  }

  /**
   * Stop idle checking
   */
  stop(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    console.log('[IdleDetector] Stopped');
  }
}
