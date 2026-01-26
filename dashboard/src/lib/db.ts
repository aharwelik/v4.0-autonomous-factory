import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database location - in project root for persistence
const DB_DIR = path.join(process.cwd(), '..', 'data');
const DB_PATH = path.join(DB_DIR, 'factory.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database with WAL mode for better performance
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 10000');
db.pragma('temp_store = MEMORY');

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

db.exec(`
  -- Ideas table
  CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT,
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Apps table
  CREATE TABLE IF NOT EXISTS apps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT,
    idea_id TEXT REFERENCES ideas(id),
    status TEXT DEFAULT 'building',
    tech_stack TEXT,
    deploy_url TEXT,
    path TEXT,
    spec TEXT,
    preview_image TEXT,
    mrr REAL DEFAULT 0,
    customers INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Agent runs table
  CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY,
    agent_type TEXT NOT NULL,
    task TEXT,
    status TEXT DEFAULT 'running',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    tokens_used INTEGER DEFAULT 0,
    cost REAL DEFAULT 0,
    result TEXT,
    error TEXT
  );

  -- Cost tracking table
  CREATE TABLE IF NOT EXISTS costs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT NOT NULL,
    operation TEXT,
    tokens INTEGER DEFAULT 0,
    cost REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Cache table for API responses and computed data
  CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Settings table
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Background jobs table (payload renamed to data for clarity)
  CREATE TABLE IF NOT EXISTS background_jobs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    payload TEXT,
    data TEXT,
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    run_in_background INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    result TEXT,
    error TEXT
  );

  -- Create indexes for fast lookups
  CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
  CREATE INDEX IF NOT EXISTS idx_ideas_score ON ideas(score DESC);
  CREATE INDEX IF NOT EXISTS idx_apps_status ON apps(status);
  CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);
  CREATE INDEX IF NOT EXISTS idx_costs_service ON costs(service);
  CREATE INDEX IF NOT EXISTS idx_costs_created ON costs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON background_jobs(status, priority DESC);
`);

// ═══════════════════════════════════════════════════════════════════════════
// CACHE LAYER - Fast key-value storage with TTL
// ═══════════════════════════════════════════════════════════════════════════

export const cache = {
  get: <T>(key: string): T | null => {
    const stmt = db.prepare(`
      SELECT value FROM cache
      WHERE key = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
    `);
    const row = stmt.get(key) as { value: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return row.value as T;
    }
  },

  set: (key: string, value: unknown, ttlSeconds?: number): void => {
    const expiresAt = ttlSeconds
      ? new Date(Date.now() + ttlSeconds * 1000).toISOString()
      : null;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO cache (key, value, expires_at, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    stmt.run(key, JSON.stringify(value), expiresAt);
  },

  delete: (key: string): void => {
    db.prepare('DELETE FROM cache WHERE key = ?').run(key);
  },

  clear: (): void => {
    db.prepare('DELETE FROM cache').run();
  },

  cleanup: (): number => {
    const result = db.prepare(`DELETE FROM cache WHERE expires_at < datetime('now')`).run();
    return result.changes;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// IDEAS
// ═══════════════════════════════════════════════════════════════════════════

export interface Idea {
  id: string;
  title: string;
  description?: string;
  source?: string;
  score: number;
  status: 'new' | 'validating' | 'validated' | 'queued' | 'building' | 'built' | 'deploying' | 'deployed' | 'rejected' | 'failed';
  validation_result?: string;  // JSON of AI validation
  build_job_id?: string;       // Link to background job
  app_id?: string;             // Link to generated app
  deploy_url?: string;         // Live URL if deployed
  error?: string;              // Error message if failed
  created_at: string;
  updated_at: string;
}

export const ideas = {
  create: (idea: Omit<Idea, 'created_at' | 'updated_at'>): Idea => {
    const stmt = db.prepare(`
      INSERT INTO ideas (id, title, description, source, score, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(idea.id, idea.title, idea.description, idea.source, idea.score, idea.status);
    return ideas.get(idea.id)!;
  },

  get: (id: string): Idea | null => {
    return db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as Idea | null;
  },

  list: (status?: string, limit = 50): Idea[] => {
    if (status) {
      return db.prepare('SELECT * FROM ideas WHERE status = ? ORDER BY score DESC LIMIT ?')
        .all(status, limit) as Idea[];
    }
    return db.prepare('SELECT * FROM ideas ORDER BY created_at DESC LIMIT ?')
      .all(limit) as Idea[];
  },

  update: (id: string, updates: Partial<Idea>): Idea | null => {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    if (fields.length === 0) return ideas.get(id);

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as Record<string, unknown>)[f]);

    db.prepare(`UPDATE ideas SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
      .run(...values, id);
    return ideas.get(id);
  },

  delete: (id: string): boolean => {
    const result = db.prepare('DELETE FROM ideas WHERE id = ?').run(id);
    return result.changes > 0;
  },

  stats: () => {
    return db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
        SUM(CASE WHEN status = 'validating' THEN 1 ELSE 0 END) as validating,
        SUM(CASE WHEN status = 'validated' THEN 1 ELSE 0 END) as validated,
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
        SUM(CASE WHEN status = 'building' THEN 1 ELSE 0 END) as building,
        SUM(CASE WHEN status = 'built' THEN 1 ELSE 0 END) as built,
        SUM(CASE WHEN status = 'deploying' THEN 1 ELSE 0 END) as deploying,
        SUM(CASE WHEN status = 'deployed' THEN 1 ELSE 0 END) as deployed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status IN ('validating', 'queued', 'building', 'deploying') THEN 1 ELSE 0 END) as active,
        AVG(score) as avg_score
      FROM ideas
    `).get();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// APPS
// ═══════════════════════════════════════════════════════════════════════════

export interface App {
  id: string;
  name: string;
  display_name?: string;
  idea_id?: string;
  status: 'building' | 'built' | 'deployed' | 'live' | 'paused';
  tech_stack?: string;
  deploy_url?: string;
  path?: string;
  spec?: string;
  preview_image?: string;
  mrr: number;
  customers: number;
  created_at: string;
  updated_at: string;
}

export const apps = {
  create: (app: { id: string; name: string; displayName?: string; ideaId?: string; status?: string; techStack?: string; deployUrl?: string; path?: string; spec?: string; previewImage?: string; mrr?: number; customers?: number }): App => {
    const stmt = db.prepare(`
      INSERT INTO apps (id, name, display_name, idea_id, status, tech_stack, deploy_url, path, spec, preview_image, mrr, customers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      app.id,
      app.name,
      app.displayName || app.name,
      app.ideaId,
      app.status || 'building',
      app.techStack,
      app.deployUrl,
      app.path,
      app.spec,
      app.previewImage,
      app.mrr || 0,
      app.customers || 0
    );
    return apps.get(app.id)!;
  },

  get: (id: string): App | null => {
    return db.prepare('SELECT * FROM apps WHERE id = ?').get(id) as App | null;
  },

  list: (limit = 50): App[] => {
    return db.prepare('SELECT * FROM apps ORDER BY created_at DESC LIMIT ?').all(limit) as App[];
  },

  update: (id: string, updates: Partial<App>): App | null => {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    if (fields.length === 0) return apps.get(id);

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as Record<string, unknown>)[f]);

    db.prepare(`UPDATE apps SET ${setClause}, updated_at = datetime('now') WHERE id = ?`)
      .run(...values, id);
    return apps.get(id);
  },

  totalMRR: (): number => {
    const result = db.prepare("SELECT COALESCE(SUM(mrr), 0) as total FROM apps WHERE status = 'live'").get() as { total: number };
    return result.total;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// AGENT RUNS
// ═══════════════════════════════════════════════════════════════════════════

export interface AgentRun {
  id: string;
  agent_type: string;
  task?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  tokens_used: number;
  cost: number;
  result?: string;
  error?: string;
}

export const agentRuns = {
  create: (run: Omit<AgentRun, 'started_at'>): AgentRun => {
    const stmt = db.prepare(`
      INSERT INTO agent_runs (id, agent_type, task, status, tokens_used, cost)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(run.id, run.agent_type, run.task, run.status, run.tokens_used, run.cost);
    return agentRuns.get(run.id)!;
  },

  get: (id: string): AgentRun | null => {
    return db.prepare('SELECT * FROM agent_runs WHERE id = ?').get(id) as AgentRun | null;
  },

  list: (status?: string, limit = 50): AgentRun[] => {
    if (status) {
      return db.prepare('SELECT * FROM agent_runs WHERE status = ? ORDER BY started_at DESC LIMIT ?')
        .all(status, limit) as AgentRun[];
    }
    return db.prepare('SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT ?')
      .all(limit) as AgentRun[];
  },

  complete: (id: string, result?: string, error?: string): void => {
    db.prepare(`
      UPDATE agent_runs
      SET status = ?, completed_at = datetime('now'), result = ?, error = ?
      WHERE id = ?
    `).run(error ? 'failed' : 'completed', result, error, id);
  },

  running: (): AgentRun[] => {
    return db.prepare("SELECT * FROM agent_runs WHERE status = 'running' ORDER BY started_at DESC")
      .all() as AgentRun[];
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COST TRACKING
// ═══════════════════════════════════════════════════════════════════════════

export const costs = {
  add: (service: string, cost: number, tokens = 0, operation?: string): void => {
    db.prepare(`
      INSERT INTO costs (service, operation, tokens, cost)
      VALUES (?, ?, ?, ?)
    `).run(service, operation, tokens, cost);
  },

  today: (): number => {
    const result = db.prepare(`
      SELECT COALESCE(SUM(cost), 0) as total
      FROM costs
      WHERE date(created_at) = date('now')
    `).get() as { total: number };
    return result.total;
  },

  thisMonth: (): number => {
    const result = db.prepare(`
      SELECT COALESCE(SUM(cost), 0) as total
      FROM costs
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).get() as { total: number };
    return result.total;
  },

  byService: (days = 30): Record<string, number> => {
    const rows = db.prepare(`
      SELECT service, SUM(cost) as total
      FROM costs
      WHERE created_at > datetime('now', '-${days} days')
      GROUP BY service
    `).all() as { service: string; total: number }[];

    return Object.fromEntries(rows.map(r => [r.service, r.total]));
  },

  history: (days = 30): { date: string; cost: number }[] => {
    return db.prepare(`
      SELECT date(created_at) as date, SUM(cost) as cost
      FROM costs
      WHERE created_at > datetime('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY date DESC
    `).all() as { date: string; cost: number }[];
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

export const settings = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    if (!row) return defaultValue ?? null;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return row.value as T;
    }
  },

  set: (key: string, value: unknown): void => {
    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
    `).run(key, JSON.stringify(value));
  },

  delete: (key: string): void => {
    db.prepare('DELETE FROM settings WHERE key = ?').run(key);
  },

  all: (): Record<string, unknown> => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    return Object.fromEntries(rows.map(r => {
      try {
        return [r.key, JSON.parse(r.value)];
      } catch {
        return [r.key, r.value];
      }
    }));
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND JOBS
// ═══════════════════════════════════════════════════════════════════════════

export interface BackgroundJob {
  id: string;
  type: string;
  payload?: string;
  data?: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed';
  priority: number;
  run_in_background: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  result?: string;
  error?: string;
}

export const backgroundJobs = {
  create: (job: { id: string; type: string; data?: string; status?: string; payload?: unknown; priority?: number; runInBackground?: boolean; createdAt?: string }): BackgroundJob => {
    const stmt = db.prepare(`
      INSERT INTO background_jobs (id, type, payload, status, priority, run_in_background)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      job.id,
      job.type,
      job.data || (job.payload ? JSON.stringify(job.payload) : null),
      job.status || 'pending',
      job.priority ?? 0,
      job.runInBackground !== false ? 1 : 0
    );
    return backgroundJobs.get(job.id)!;
  },

  get: (id: string): BackgroundJob | null => {
    return db.prepare('SELECT * FROM background_jobs WHERE id = ?').get(id) as BackgroundJob | null;
  },

  pending: (): BackgroundJob[] => {
    return db.prepare(`
      SELECT * FROM background_jobs
      WHERE status = 'pending'
      ORDER BY priority DESC, created_at ASC
    `).all() as BackgroundJob[];
  },

  getPending: (): BackgroundJob[] => {
    return db.prepare(`
      SELECT * FROM background_jobs
      WHERE status IN ('pending', 'queued', 'running')
      ORDER BY priority DESC, created_at ASC
    `).all() as BackgroundJob[];
  },

  start: (id: string): void => {
    db.prepare(`
      UPDATE background_jobs
      SET status = 'running', started_at = datetime('now')
      WHERE id = ?
    `).run(id);
  },

  complete: (id: string, result?: string): void => {
    db.prepare(`
      UPDATE background_jobs
      SET status = 'completed', completed_at = datetime('now'), result = ?
      WHERE id = ?
    `).run(result, id);
  },

  fail: (id: string, error: string): void => {
    db.prepare(`
      UPDATE background_jobs
      SET status = 'failed', completed_at = datetime('now'), error = ?
      WHERE id = ?
    `).run(error, id);
  },

  running: (): BackgroundJob[] => {
    return db.prepare("SELECT * FROM background_jobs WHERE status = 'running'").all() as BackgroundJob[];
  },

  update: (id: string, updates: Partial<BackgroundJob> & { startedAt?: string; completedAt?: string }): void => {
    const fieldMap: Record<string, string> = {
      status: 'status',
      startedAt: 'started_at',
      completedAt: 'completed_at',
      result: 'result',
      error: 'error',
      data: 'data'
    };

    const dbUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      const dbKey = fieldMap[key] || key;
      dbUpdates[dbKey] = value;
    }

    const fields = Object.keys(dbUpdates);
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => dbUpdates[f]);

    db.prepare(`UPDATE background_jobs SET ${setClause} WHERE id = ?`).run(...values, id);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

// Initialize default settings if not exist
const defaultSettings = {
  'runInBackground': true,
  'cacheEnabled': true,
  'cacheTTL': 3600, // 1 hour default cache TTL
  'budgetMonthly': 100,
  'budgetWarning': 0.75,
  'budgetCritical': 0.90,
  'parallelAgents': 3,
  'autoValidate': true,
};

for (const [key, value] of Object.entries(defaultSettings)) {
  if (settings.get(key) === null) {
    settings.set(key, value);
  }
}

// Export the raw database for advanced queries
export { db };

// Cleanup expired cache on startup
cache.cleanup();
