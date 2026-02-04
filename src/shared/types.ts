export interface Config {
  docs: {
    enabled: boolean;
    patterns: string[];
    ignore: string[];
  };
}

export interface LoopStatus {
  started: string;
  phase: 'planning' | 'implementing' | 'testing' | 'complete' | 'failed';
  updated: string;
  tasks: {
    total: number;
    completed: number;
  };
  notes: string[];
}

export interface ProjectState {
  lastUpdated: string;
  currentFocus: string;
  recentActivity: Array<{
    date: string;
    description: string;
  }>;
  openItems: string[];
  proposedNextSteps: string[];
}

export interface LoopDraft {
  id: string;
  name: string;
  description: string;
  dependencies: string[];  // IDs of loops that must complete first
  estimatedScope: 'small' | 'medium' | 'large';
  files: string[];         // Files likely to be affected
  inspiration?: string;    // Template or external repo that inspired this
}

export interface LoopPlan {
  created: string;
  overview: string;
  projectContext: string;
  loops: LoopDraft[];
  executionOrder: string[][]; // Groups of loop IDs that can run in parallel
}

export interface PlanState {
  active: boolean;
  startedAt: string | null;
  stoppedAt?: string | null;
  model: string;
  theme: string | null;  // User-provided focus/direction
  iterations: number;
  currentLoopPlan: string | null;  // Path to active loop_plan folder
  lastIteration: string | null;
  tokensUsed: number;
  session_summaries?: Array<{
    sessionId: string;
    iterations: number;
    summary: string;
  }>;
}

export interface CommitInfo {
  hash: string;
  message: string;
  type: 'feat' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore';
  scope?: string;
  filesChanged: string[];
  createdAt: string;
}

export interface TestResult {
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  readyForCommit: boolean;
  summary: string;
  failures?: string[];
}
