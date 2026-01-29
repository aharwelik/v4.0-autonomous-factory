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

  -- Opportunity signals table
  CREATE TABLE IF NOT EXISTS opportunity_signals (
    id TEXT PRIMARY KEY,
    idea_id TEXT REFERENCES ideas(id),
    signal_type TEXT,
    source TEXT,
    content TEXT,
    url TEXT,
    score INTEGER,
    sentiment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Market trends table
  CREATE TABLE IF NOT EXISTS market_trends (
    id TEXT PRIMARY KEY,
    keyword TEXT,
    search_volume INTEGER,
    growth_rate REAL,
    snapshot_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Competitors table
  CREATE TABLE IF NOT EXISTS competitors (
    id TEXT PRIMARY KEY,
    idea_id TEXT REFERENCES ideas(id),
    name TEXT,
    url TEXT,
    pricing TEXT,
    gap_analysis TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Marketing campaigns table
  CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id TEXT PRIMARY KEY,
    app_id TEXT REFERENCES apps(id),
    type TEXT,
    status TEXT,
    content TEXT,
    performance TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- App performance table
  CREATE TABLE IF NOT EXISTS app_performance (
    id TEXT PRIMARY KEY,
    app_id TEXT REFERENCES apps(id),
    metric_date DATE,
    visitors INTEGER,
    revenue REAL,
    uptime_percent REAL,
    error_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  CREATE INDEX IF NOT EXISTS idx_signals_idea ON opportunity_signals(idea_id);
  CREATE INDEX IF NOT EXISTS idx_signals_type ON opportunity_signals(signal_type);
  CREATE INDEX IF NOT EXISTS idx_trends_keyword ON market_trends(keyword, snapshot_date DESC);
  CREATE INDEX IF NOT EXISTS idx_competitors_idea ON competitors(idea_id);
  CREATE INDEX IF NOT EXISTS idx_campaigns_app ON marketing_campaigns(app_id);
  CREATE INDEX IF NOT EXISTS idx_performance_app ON app_performance(app_id, metric_date DESC);
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
  auto_discovered: number;     // 0 or 1 (SQLite boolean)
  signal_count: number;        // Number of signals collected
  search_growth: number;       // % growth in search volume
  competitor_count: number;    // Number of competitors found
  validation_proof?: string;   // JSON of validation data
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

  getAll: (limit = 50): BackgroundJob[] => {
    return db.prepare(`
      SELECT * FROM background_jobs
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as BackgroundJob[];
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

// ═══════════════════════════════════════════════════════════════════════════
// OPPORTUNITY SIGNALS
// ═══════════════════════════════════════════════════════════════════════════

export interface OpportunitySignal {
  id: string;
  idea_id?: string;
  signal_type: string;
  source: string;
  content: string;
  url?: string;
  score: number;
  sentiment?: string;
  created_at: string;
}

export const opportunitySignals = {
  create: (signal: Omit<OpportunitySignal, 'created_at'>): OpportunitySignal => {
    const stmt = db.prepare(`
      INSERT INTO opportunity_signals (id, idea_id, signal_type, source, content, url, score, sentiment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(signal.id, signal.idea_id, signal.signal_type, signal.source, signal.content, signal.url, signal.score, signal.sentiment);
    return opportunitySignals.get(signal.id)!;
  },

  get: (id: string): OpportunitySignal | null => {
    return db.prepare('SELECT * FROM opportunity_signals WHERE id = ?').get(id) as OpportunitySignal | null;
  },

  listByIdea: (ideaId: string, limit = 100): OpportunitySignal[] => {
    return db.prepare('SELECT * FROM opportunity_signals WHERE idea_id = ? ORDER BY score DESC LIMIT ?')
      .all(ideaId, limit) as OpportunitySignal[];
  },

  listByType: (signalType: string, limit = 50): OpportunitySignal[] => {
    return db.prepare('SELECT * FROM opportunity_signals WHERE signal_type = ? ORDER BY created_at DESC LIMIT ?')
      .all(signalType, limit) as OpportunitySignal[];
  },

  countByIdea: (ideaId: string): number => {
    const result = db.prepare('SELECT COUNT(*) as count FROM opportunity_signals WHERE idea_id = ?').get(ideaId) as { count: number };
    return result.count;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MARKET TRENDS
// ═══════════════════════════════════════════════════════════════════════════

export interface MarketTrend {
  id: string;
  keyword: string;
  search_volume: number;
  growth_rate: number;
  snapshot_date: string;
  created_at: string;
}

export const marketTrends = {
  create: (trend: Omit<MarketTrend, 'created_at'>): MarketTrend => {
    const stmt = db.prepare(`
      INSERT INTO market_trends (id, keyword, search_volume, growth_rate, snapshot_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(trend.id, trend.keyword, trend.search_volume, trend.growth_rate, trend.snapshot_date);
    return marketTrends.get(trend.id)!;
  },

  get: (id: string): MarketTrend | null => {
    return db.prepare('SELECT * FROM market_trends WHERE id = ?').get(id) as MarketTrend | null;
  },

  getLatest: (keyword: string): MarketTrend | null => {
    return db.prepare('SELECT * FROM market_trends WHERE keyword = ? ORDER BY snapshot_date DESC LIMIT 1')
      .get(keyword) as MarketTrend | null;
  },

  listByKeyword: (keyword: string, limit = 30): MarketTrend[] => {
    return db.prepare('SELECT * FROM market_trends WHERE keyword = ? ORDER BY snapshot_date DESC LIMIT ?')
      .all(keyword, limit) as MarketTrend[];
  },

  trending: (minGrowth = 20, limit = 10): MarketTrend[] => {
    return db.prepare(`
      SELECT * FROM market_trends
      WHERE growth_rate >= ?
      AND snapshot_date = date('now')
      ORDER BY growth_rate DESC
      LIMIT ?
    `).all(minGrowth, limit) as MarketTrend[];
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPETITORS
// ═══════════════════════════════════════════════════════════════════════════

export interface Competitor {
  id: string;
  idea_id?: string;
  name: string;
  url?: string;
  pricing?: string;
  gap_analysis?: string;
  created_at: string;
}

export const competitors = {
  create: (competitor: Omit<Competitor, 'created_at'>): Competitor => {
    const stmt = db.prepare(`
      INSERT INTO competitors (id, idea_id, name, url, pricing, gap_analysis)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(competitor.id, competitor.idea_id, competitor.name, competitor.url, competitor.pricing, competitor.gap_analysis);
    return competitors.get(competitor.id)!;
  },

  get: (id: string): Competitor | null => {
    return db.prepare('SELECT * FROM competitors WHERE id = ?').get(id) as Competitor | null;
  },

  listByIdea: (ideaId: string): Competitor[] => {
    return db.prepare('SELECT * FROM competitors WHERE idea_id = ? ORDER BY created_at DESC')
      .all(ideaId) as Competitor[];
  },

  countByIdea: (ideaId: string): number => {
    const result = db.prepare('SELECT COUNT(*) as count FROM competitors WHERE idea_id = ?').get(ideaId) as { count: number };
    return result.count;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MARKETING CAMPAIGNS
// ═══════════════════════════════════════════════════════════════════════════

export interface MarketingCampaign {
  id: string;
  app_id?: string;
  type: string;
  status: string;
  content?: string;
  performance?: string;
  created_at: string;
}

export const marketingCampaigns = {
  create: (campaign: Omit<MarketingCampaign, 'created_at'>): MarketingCampaign => {
    const stmt = db.prepare(`
      INSERT INTO marketing_campaigns (id, app_id, type, status, content, performance)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(campaign.id, campaign.app_id, campaign.type, campaign.status, campaign.content, campaign.performance);
    return marketingCampaigns.get(campaign.id)!;
  },

  get: (id: string): MarketingCampaign | null => {
    return db.prepare('SELECT * FROM marketing_campaigns WHERE id = ?').get(id) as MarketingCampaign | null;
  },

  listByApp: (appId: string, limit = 50): MarketingCampaign[] => {
    return db.prepare('SELECT * FROM marketing_campaigns WHERE app_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(appId, limit) as MarketingCampaign[];
  },

  update: (id: string, updates: Partial<MarketingCampaign>): MarketingCampaign | null => {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    if (fields.length === 0) return marketingCampaigns.get(id);

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => (updates as Record<string, unknown>)[f]);

    db.prepare(`UPDATE marketing_campaigns SET ${setClause} WHERE id = ?`).run(...values, id);
    return marketingCampaigns.get(id);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// APP PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════

export interface AppPerformance {
  id: string;
  app_id?: string;
  metric_date: string;
  visitors: number;
  revenue: number;
  uptime_percent: number;
  error_count: number;
  created_at: string;
}

export const appPerformance = {
  create: (performance: Omit<AppPerformance, 'created_at'>): AppPerformance => {
    const stmt = db.prepare(`
      INSERT INTO app_performance (id, app_id, metric_date, visitors, revenue, uptime_percent, error_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(performance.id, performance.app_id, performance.metric_date, performance.visitors, performance.revenue, performance.uptime_percent, performance.error_count);
    return appPerformance.get(performance.id)!;
  },

  get: (id: string): AppPerformance | null => {
    return db.prepare('SELECT * FROM app_performance WHERE id = ?').get(id) as AppPerformance | null;
  },

  listByApp: (appId: string, days = 30): AppPerformance[] => {
    return db.prepare(`
      SELECT * FROM app_performance
      WHERE app_id = ?
      AND metric_date > date('now', '-${days} days')
      ORDER BY metric_date DESC
    `).all(appId) as AppPerformance[];
  },

  getLatest: (appId: string): AppPerformance | null => {
    return db.prepare('SELECT * FROM app_performance WHERE app_id = ? ORDER BY metric_date DESC LIMIT 1')
      .get(appId) as AppPerformance | null;
  },

  stats: (appId: string, days = 30): { totalVisitors: number; totalRevenue: number; avgUptime: number; totalErrors: number } => {
    const result = db.prepare(`
      SELECT
        COALESCE(SUM(visitors), 0) as totalVisitors,
        COALESCE(SUM(revenue), 0) as totalRevenue,
        COALESCE(AVG(uptime_percent), 0) as avgUptime,
        COALESCE(SUM(error_count), 0) as totalErrors
      FROM app_performance
      WHERE app_id = ? AND metric_date > date('now', '-${days} days')
    `).get(appId) as { totalVisitors: number; totalRevenue: number; avgUptime: number; totalErrors: number };
    return result;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE MIGRATIONS - Add new columns to existing tables
// ═══════════════════════════════════════════════════════════════════════════

// Helper to check if column exists
function columnExists(tableName: string, columnName: string): boolean {
  const result = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  return result.some(col => col.name === columnName);
}

// Run migrations (safe to run multiple times - errors are caught and ignored)
try {
  // Migrate ideas table - add new columns for opportunity engine
  if (!columnExists('ideas', 'auto_discovered')) {
    db.exec('ALTER TABLE ideas ADD COLUMN auto_discovered INTEGER DEFAULT 0');
  }
} catch (e) {
  // Column might already exist from another instance
}

try {
  if (!columnExists('ideas', 'signal_count')) {
    db.exec('ALTER TABLE ideas ADD COLUMN signal_count INTEGER DEFAULT 0');
  }
} catch (e) {
  // Column might already exist
}

try {
  if (!columnExists('ideas', 'search_growth')) {
    db.exec('ALTER TABLE ideas ADD COLUMN search_growth REAL DEFAULT 0');
  }
} catch (e) {
  // Column might already exist
}

try {
  if (!columnExists('ideas', 'competitor_count')) {
    db.exec('ALTER TABLE ideas ADD COLUMN competitor_count INTEGER DEFAULT 0');
  }
} catch (e) {
  // Column might already exist
}

try {
  if (!columnExists('ideas', 'validation_proof')) {
    db.exec('ALTER TABLE ideas ADD COLUMN validation_proof TEXT');
  }
} catch (e) {
  // Column might already exist
}

// Create indexes for new columns (safe - uses IF NOT EXISTS)
try {
  if (columnExists('ideas', 'auto_discovered') && columnExists('ideas', 'signal_count')) {
    db.exec('CREATE INDEX IF NOT EXISTS idx_ideas_auto_discovered ON ideas(auto_discovered, signal_count DESC)');
  }
} catch (e) {
  // Index might already exist
}

// Export the raw database for advanced queries
export { db };

// Cleanup expired cache on startup
cache.cleanup();
