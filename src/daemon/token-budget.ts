import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getDreamstateDir } from '../shared/config.js';
import type { TokenBudget, TokenUsage } from '../shared/types.js';

const BUDGET_FILE = 'token-budget.json';

// Approximate token counts per model per operation
const TOKEN_ESTIMATES: Record<string, number> = {
  'haiku-small': 500,
  'haiku-medium': 2000,
  'haiku-large': 5000,
  'sonnet-small': 1000,
  'sonnet-medium': 4000,
  'sonnet-large': 10000,
  'opus-small': 2000,
  'opus-medium': 8000,
  'opus-large': 20000,
};

export class TokenBudgetTracker {
  private workspaceRoot: string;
  private budget: TokenBudget;
  private budgetPath: string;
  private hourlyLimit: number;

  constructor(workspaceRoot: string, hourlyLimit: number) {
    this.workspaceRoot = workspaceRoot;
    this.hourlyLimit = hourlyLimit;
    this.budgetPath = join(getDreamstateDir(workspaceRoot), BUDGET_FILE);
    this.budget = this.loadBudget();
  }

  private loadBudget(): TokenBudget {
    if (existsSync(this.budgetPath)) {
      try {
        const data = JSON.parse(readFileSync(this.budgetPath, 'utf-8')) as TokenBudget;
        // Check if we need to reset the hour
        if (this.isNewHour(data.hourStartedAt)) {
          return this.createNewBudget();
        }
        return data;
      } catch {
        return this.createNewBudget();
      }
    }
    return this.createNewBudget();
  }

  private createNewBudget(): TokenBudget {
    return {
      hourlyLimit: this.hourlyLimit,
      currentHourUsage: 0,
      hourStartedAt: new Date().toISOString(),
      history: [],
      isPaused: false,
    };
  }

  private isNewHour(hourStartedAt: string): boolean {
    const started = new Date(hourStartedAt).getTime();
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    return now - started >= hourMs;
  }

  private saveBudget(): void {
    writeFileSync(this.budgetPath, JSON.stringify(this.budget, null, 2));
  }

  private maybeResetHour(): void {
    if (this.isNewHour(this.budget.hourStartedAt)) {
      // Keep last 100 history entries for debugging
      const recentHistory = this.budget.history.slice(-100);
      this.budget = this.createNewBudget();
      this.budget.history = recentHistory;
      this.saveBudget();
    }
  }

  /**
   * Check if we can spend tokens for an operation
   */
  canSpend(estimatedTokens: number): boolean {
    this.maybeResetHour();
    return !this.budget.isPaused &&
           (this.budget.currentHourUsage + estimatedTokens) <= this.hourlyLimit;
  }

  /**
   * Check if budget is exceeded
   */
  isOverBudget(): boolean {
    this.maybeResetHour();
    return this.budget.currentHourUsage >= this.hourlyLimit;
  }

  /**
   * Record token usage for an operation
   */
  recordUsage(operation: string, tokensUsed: number, model: string): void {
    this.maybeResetHour();

    const usage: TokenUsage = {
      timestamp: new Date().toISOString(),
      operation,
      tokensUsed,
      model,
    };

    this.budget.history.push(usage);
    this.budget.currentHourUsage += tokensUsed;

    // Auto-pause if over budget
    if (this.budget.currentHourUsage >= this.hourlyLimit) {
      this.budget.isPaused = true;
      console.log(`[TokenBudget] Budget exceeded (${this.budget.currentHourUsage}/${this.hourlyLimit}). Operations paused.`);
    }

    this.saveBudget();
  }

  /**
   * Estimate tokens for an operation
   */
  estimateTokens(model: string, size: 'small' | 'medium' | 'large'): number {
    const key = `${model}-${size}`;
    return TOKEN_ESTIMATES[key] || TOKEN_ESTIMATES['haiku-medium'];
  }

  /**
   * Get current budget status
   */
  getStatus(): {
    used: number;
    limit: number;
    remaining: number;
    isPaused: boolean;
    hourStartedAt: string;
    recentOperations: TokenUsage[];
  } {
    this.maybeResetHour();
    return {
      used: this.budget.currentHourUsage,
      limit: this.hourlyLimit,
      remaining: Math.max(0, this.hourlyLimit - this.budget.currentHourUsage),
      isPaused: this.budget.isPaused,
      hourStartedAt: this.budget.hourStartedAt,
      recentOperations: this.budget.history.slice(-5),
    };
  }

  /**
   * Resume operations after budget pause
   */
  resume(): void {
    this.budget.isPaused = false;
    this.saveBudget();
    console.log('[TokenBudget] Operations resumed.');
  }

  /**
   * Manually pause operations
   */
  pause(): void {
    this.budget.isPaused = true;
    this.saveBudget();
    console.log('[TokenBudget] Operations paused.');
  }
}
