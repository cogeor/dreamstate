import { TokenBudgetTracker } from './token-budget.js';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

// Simple test runner matching existing pattern
function test(name: string, fn: () => void | Promise<void>): void {
  const runTest = async () => {
    try {
      await fn();
      console.log(`✓ ${name}`);
    } catch (error) {
      console.error(`✗ ${name}`);
      console.error(error);
      process.exit(1);
    }
  };
  runTest();
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message || `Expected "${expected}" but got "${actual}"`);
  }
}

function assertTrue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFalse(condition: boolean, message: string): void {
  if (condition) {
    throw new Error(message);
  }
}

// Test workspace setup
const TEST_WORKSPACE = join(process.cwd(), '.test-workspace');
const DREAMSTATE_DIR = join(TEST_WORKSPACE, '.dreamstate');
const BUDGET_FILE = join(DREAMSTATE_DIR, 'token-budget.json');

function setupTestWorkspace(): void {
  if (existsSync(TEST_WORKSPACE)) {
    rmSync(TEST_WORKSPACE, { recursive: true });
  }
  mkdirSync(DREAMSTATE_DIR, { recursive: true });
}

function cleanupTestWorkspace(): void {
  if (existsSync(TEST_WORKSPACE)) {
    rmSync(TEST_WORKSPACE, { recursive: true });
  }
}

// Tests
test('creates new budget with default values', () => {
  setupTestWorkspace();
  const tracker = new TokenBudgetTracker(TEST_WORKSPACE, 100000);
  const status = tracker.getStatus();

  assertEqual(status.limit, 100000, 'limit should be 100000');
  assertEqual(status.used, 0, 'used should be 0');
  assertEqual(status.remaining, 100000, 'remaining should be 100000');
  assertFalse(status.isPaused, 'should not be paused');

  cleanupTestWorkspace();
});

test('records token usage correctly', () => {
  setupTestWorkspace();
  const tracker = new TokenBudgetTracker(TEST_WORKSPACE, 100000);

  tracker.recordUsage('test-operation', 500, 'haiku');
  const status = tracker.getStatus();

  assertEqual(status.used, 500, 'used should be 500');
  assertEqual(status.remaining, 99500, 'remaining should be 99500');
  assertFalse(status.isPaused, 'should not be paused');

  cleanupTestWorkspace();
});

test('canSpend returns true when budget available', () => {
  setupTestWorkspace();
  const tracker = new TokenBudgetTracker(TEST_WORKSPACE, 100000);

  assertTrue(tracker.canSpend(500), 'should be able to spend 500 tokens');
  assertTrue(tracker.canSpend(99999), 'should be able to spend 99999 tokens');

  cleanupTestWorkspace();
});

test('canSpend returns false when budget exceeded', () => {
  setupTestWorkspace();
  const tracker = new TokenBudgetTracker(TEST_WORKSPACE, 1000);

  tracker.recordUsage('operation1', 600, 'haiku');
  assertTrue(tracker.canSpend(400), 'should be able to spend 400 tokens');
  assertFalse(tracker.canSpend(401), 'should not be able to spend 401 tokens');

  cleanupTestWorkspace();
});

test('auto-pauses when budget exceeded', () => {
  setupTestWorkspace();
  const tracker = new TokenBudgetTracker(TEST_WORKSPACE, 1000);

  tracker.recordUsage('operation1', 1000, 'haiku');
  const status = tracker.getStatus();

  assertTrue(status.isPaused, 'should be auto-paused');
  assertTrue(tracker.isOverBudget(), 'should be over budget');

  cleanupTestWorkspace();
});

test('persists budget to file', () => {
  setupTestWorkspace();
  const tracker = new TokenBudgetTracker(TEST_WORKSPACE, 100000);

  tracker.recordUsage('test-op', 500, 'haiku');

  assertTrue(existsSync(BUDGET_FILE), 'budget file should exist');
  const data = JSON.parse(readFileSync(BUDGET_FILE, 'utf-8'));

  assertEqual(data.currentHourUsage, 500, 'persisted usage should be 500');
  assertEqual(data.hourlyLimit, 100000, 'persisted limit should be 100000');

  cleanupTestWorkspace();
});

test('loads existing budget from file', () => {
  setupTestWorkspace();

  // Create first tracker and record usage
  const tracker1 = new TokenBudgetTracker(TEST_WORKSPACE, 100000);
  tracker1.recordUsage('test-op', 500, 'haiku');

  // Create second tracker (should load from file)
  const tracker2 = new TokenBudgetTracker(TEST_WORKSPACE, 100000);
  const status = tracker2.getStatus();

  assertEqual(status.used, 500, 'loaded usage should be 500');

  cleanupTestWorkspace();
});

test('resume unpauses operations', () => {
  setupTestWorkspace();
  const tracker = new TokenBudgetTracker(TEST_WORKSPACE, 1000);

  tracker.recordUsage('operation1', 1000, 'haiku');
  assertTrue(tracker.getStatus().isPaused, 'should be paused');

  tracker.resume();
  assertFalse(tracker.getStatus().isPaused, 'should not be paused after resume');

  cleanupTestWorkspace();
});

test('pause manually stops operations', () => {
  setupTestWorkspace();
  const tracker = new TokenBudgetTracker(TEST_WORKSPACE, 100000);

  assertFalse(tracker.getStatus().isPaused, 'should not be paused initially');

  tracker.pause();
  assertTrue(tracker.getStatus().isPaused, 'should be paused after pause()');

  cleanupTestWorkspace();
});

test('estimateTokens returns correct estimates', () => {
  setupTestWorkspace();
  const tracker = new TokenBudgetTracker(TEST_WORKSPACE, 100000);

  assertEqual(tracker.estimateTokens('haiku', 'small'), 500);
  assertEqual(tracker.estimateTokens('haiku', 'medium'), 2000);
  assertEqual(tracker.estimateTokens('sonnet', 'large'), 10000);

  cleanupTestWorkspace();
});

console.log('\nAll token-budget tests passed!');
