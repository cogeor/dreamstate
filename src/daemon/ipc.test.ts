import { IPC } from './ipc.js';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import type { DaemonStatus, Task, TaskResult } from '../shared/types.js';

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
const TEST_WORKSPACE = join(process.cwd(), '.test-workspace-ipc');

function setupTestWorkspace(): void {
  if (existsSync(TEST_WORKSPACE)) {
    rmSync(TEST_WORKSPACE, { recursive: true });
  }
  mkdirSync(TEST_WORKSPACE, { recursive: true });
}

function cleanupTestWorkspace(): void {
  if (existsSync(TEST_WORKSPACE)) {
    rmSync(TEST_WORKSPACE, { recursive: true });
  }
}

// Tests
test('writeStatus and readStatus work correctly', () => {
  setupTestWorkspace();
  const ipc = new IPC(TEST_WORKSPACE);

  const status: DaemonStatus = {
    pid: 12345,
    startedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    uptime: 100,
    watching: ['.delegate/loops/**', 'src/**'],
    tasksProcessed: 0
  };

  ipc.writeStatus(status);
  const readStatus = ipc.readStatus();

  assertTrue(readStatus !== null, 'status should not be null');
  assertEqual(readStatus!.pid, 12345, 'pid should match');
  assertEqual(readStatus!.uptime, 100, 'uptime should match');

  cleanupTestWorkspace();
});

test('readStatus returns null when no status file exists', () => {
  setupTestWorkspace();
  const ipc = new IPC(TEST_WORKSPACE);

  const status = ipc.readStatus();
  assertTrue(status === null, 'status should be null when file does not exist');

  cleanupTestWorkspace();
});

test('writePid and readPid work correctly', () => {
  setupTestWorkspace();
  const ipc = new IPC(TEST_WORKSPACE);

  ipc.writePid(99999);
  const pid = ipc.readPid();

  assertEqual(pid, 99999, 'pid should match');

  cleanupTestWorkspace();
});

test('readPid returns null when no pid file exists', () => {
  setupTestWorkspace();
  const ipc = new IPC(TEST_WORKSPACE);

  const pid = ipc.readPid();
  assertTrue(pid === null, 'pid should be null when file does not exist');

  cleanupTestWorkspace();
});

test('clearPid removes pid file', () => {
  setupTestWorkspace();
  const ipc = new IPC(TEST_WORKSPACE);

  ipc.writePid(12345);
  assertTrue(ipc.readPid() !== null, 'pid should exist after write');

  ipc.clearPid();
  assertTrue(ipc.readPid() === null, 'pid should be null after clear');

  cleanupTestWorkspace();
});

test('submitTask and getPendingTasks work correctly', () => {
  setupTestWorkspace();
  const ipc = new IPC(TEST_WORKSPACE);

  const task: Task = {
    id: 'test-task-1',
    type: 'file-change',
    payload: { filePath: 'test.ts' },
    createdAt: new Date().toISOString()
  };

  ipc.submitTask(task);
  const tasks = ipc.getPendingTasks();

  assertEqual(tasks.length, 1, 'should have 1 pending task');
  assertEqual(tasks[0].id, 'test-task-1', 'task id should match');

  cleanupTestWorkspace();
});

test('consumeTask removes task from queue', () => {
  setupTestWorkspace();
  const ipc = new IPC(TEST_WORKSPACE);

  const task: Task = {
    id: 'test-task-2',
    type: 'file-change',
    payload: { filePath: 'test.ts' },
    createdAt: new Date().toISOString()
  };

  ipc.submitTask(task);
  assertEqual(ipc.getPendingTasks().length, 1, 'should have 1 task before consume');

  ipc.consumeTask(task.id);
  assertEqual(ipc.getPendingTasks().length, 0, 'should have 0 tasks after consume');

  cleanupTestWorkspace();
});

test('getPendingTasks returns tasks sorted by createdAt', () => {
  setupTestWorkspace();
  const ipc = new IPC(TEST_WORKSPACE);

  const task1: Task = {
    id: 'task-1',
    type: 'file-change',
    payload: { filePath: 'test1.ts' },
    createdAt: '2026-01-01T10:00:00Z'
  };

  const task2: Task = {
    id: 'task-2',
    type: 'file-change',
    payload: { filePath: 'test2.ts' },
    createdAt: '2026-01-01T09:00:00Z'
  };

  ipc.submitTask(task1);
  ipc.submitTask(task2);

  const tasks = ipc.getPendingTasks();
  assertEqual(tasks.length, 2, 'should have 2 tasks');
  assertEqual(tasks[0].id, 'task-2', 'first task should be task-2 (earlier timestamp)');
  assertEqual(tasks[1].id, 'task-1', 'second task should be task-1');

  cleanupTestWorkspace();
});

test('writeResult and readResult work correctly', () => {
  setupTestWorkspace();
  const ipc = new IPC(TEST_WORKSPACE);

  const result: TaskResult = {
    taskId: 'test-task-3',
    success: true,
    result: 'Task completed successfully',
    completedAt: new Date().toISOString()
  };

  ipc.writeResult(result);
  const readResult = ipc.readResult('test-task-3');

  assertTrue(readResult !== null, 'result should not be null');
  assertEqual(readResult!.taskId, 'test-task-3', 'taskId should match');
  assertTrue(readResult!.success, 'success should be true');

  cleanupTestWorkspace();
});

test('readResult returns null when no result file exists', () => {
  setupTestWorkspace();
  const ipc = new IPC(TEST_WORKSPACE);

  const result = ipc.readResult('nonexistent-task');
  assertTrue(result === null, 'result should be null when file does not exist');

  cleanupTestWorkspace();
});

test('clearResult removes result file', () => {
  setupTestWorkspace();
  const ipc = new IPC(TEST_WORKSPACE);

  const result: TaskResult = {
    taskId: 'test-task-4',
    success: true,
    completedAt: new Date().toISOString()
  };

  ipc.writeResult(result);
  assertTrue(ipc.readResult('test-task-4') !== null, 'result should exist after write');

  ipc.clearResult('test-task-4');
  assertTrue(ipc.readResult('test-task-4') === null, 'result should be null after clear');

  cleanupTestWorkspace();
});

console.log('\nAll IPC tests passed!');
