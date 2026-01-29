import { NextResponse } from "next/server";
import { ideas, apps, costs, cache, settings, agentRuns, backgroundJobs } from "@/lib/db";

/**
 * Dashboard API endpoint
 * Uses SQLite for persistence, falls back to demo data when empty
 */
export async function GET() {
  // Check cache first (1 minute TTL for dashboard data)
  const cacheEnabled = settings.get<boolean>('cacheEnabled') ?? true;
  const cacheKey = 'dashboard_data';

  if (cacheEnabled) {
    const cached = cache.get<ReturnType<typeof buildDashboardData>>(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true });
    }
  }

  const data = buildDashboardData();

  // Cache for 60 seconds
  if (cacheEnabled) {
    cache.set(cacheKey, data, 60);
  }

  return NextResponse.json(data);
}

function buildDashboardData() {
  const realIdeas = ideas.list(undefined, 100);
  const realApps = apps.list(100);
  const runningAgents = agentRuns.running();
  const pendingJobs = backgroundJobs.pending();

  // Use real data if we have it, otherwise demo
  const hasRealData = realIdeas.length > 0 || realApps.length > 0;

  const pipeline = hasRealData ? getRealPipelineData() : getDemoPipelineData();
  const appsData = hasRealData ? getRealAppsData() : getDemoAppsData();
  const costsData = getRealCostsData();
  const contentData = getDemoContentData(); // Content is always demo for now

  return {
    pipeline: {
      ...pipeline,
      isDemo: !hasRealData,
    },
    apps: appsData.map(app => ({
      ...app,
      isDemo: app.id.startsWith('demo-'),
    })),
    content: contentData.map(c => ({
      ...c,
      isDemo: true, // Content is always demo for now
    })),
    costs: {
      ...costsData,
      isDemo: Object.keys(getRealCostsData()).length === 0,
    },
    budget: {
      monthly: settings.get<number>('budgetMonthly') ?? 100,
      alerts: {
        warning: (settings.get<number>('budgetWarning') ?? 0.75) * 100,
        critical: (settings.get<number>('budgetCritical') ?? 0.90) * 100,
      },
    },
    settings: {
      runInBackground: settings.get<boolean>('runInBackground') ?? true,
      cacheEnabled: settings.get<boolean>('cacheEnabled') ?? true,
      cacheTTL: settings.get<number>('cacheTTL') ?? 3600,
      parallelAgents: settings.get<number>('parallelAgents') ?? 3,
      autoValidate: settings.get<boolean>('autoValidate') ?? true,
    },
    status: {
      hasRealData,
      runningAgents: runningAgents.length,
      pendingJobs: pendingJobs.length,
      dbConnected: true,
    },
    generatedAt: new Date().toISOString(),
  };
}

function getRealPipelineData() {
  const stats = ideas.stats() as {
    total: number;
    new: number;
    validating: number;
    validated: number;
    building: number;
    rejected: number;
    avg_score: number;
  };

  const recentIdeas = ideas.list(undefined, 5);

  return {
    ideas: stats.total || 0,
    validating: stats.validating || 0,
    building: stats.building || 0,
    deployed: apps.list().filter(a => a.status === 'deployed' || a.status === 'live').length,
    revenue: apps.list().filter(a => a.mrr > 0).length,
    recentOpportunities: recentIdeas.map(i => ({
      id: i.id,
      title: i.title,
      source: i.source || 'manual',
      score: i.score,
      discoveredAt: formatTimeAgo(new Date(i.created_at)),
    })),
    weeklyIdeas: recentIdeas.length,
    ideaGrowth: 0,
    highScoreIdeas: recentIdeas.filter(i => i.score >= 70).length,
    falsePositiveRate: stats.rejected ? Math.round((stats.rejected / stats.total) * 100) : 0,
    pipelineValue: apps.totalMRR() * 12,
  };
}

function getRealAppsData() {
  const appsList = apps.list();

  if (appsList.length === 0) {
    return getDemoAppsData();
  }

  return appsList.map(app => ({
    id: app.id,
    name: app.name,
    mrr: app.mrr,
    customers: app.customers,
    arpu: app.customers > 0 ? Math.round(app.mrr / app.customers) : 0,
    churnRate: 0,
    trialConversion: 0,
    revenueHistory: generateRevenueHistory(app.mrr, 6),
    userHistory: generateUserHistory(app.customers * 3, 6),
    posthogProjectId: null,
  }));
}

function getRealCostsData() {
  const byService = costs.byService(30);
  const hasRealCosts = Object.keys(byService).length > 0;

  if (!hasRealCosts) {
    return getDemoCostsData();
  }

  // Return all tracked services (AI providers + other services)
  const result: Record<string, { total: number; tokens?: number; count?: number }> = {};

  // AI Providers
  if (byService['gemini']) result['gemini'] = { total: byService['gemini'], count: 0 };
  if (byService['deepseek']) result['deepseek'] = { total: byService['deepseek'], tokens: 0 };
  if (byService['glm']) result['glm'] = { total: byService['glm'], tokens: 0 };
  if (byService['claude']) result['claude'] = { total: byService['claude'], tokens: 0 };
  if (byService['openai']) result['openai'] = { total: byService['openai'], tokens: 0 };
  if (byService['grok']) result['grok'] = { total: byService['grok'], tokens: 0 };

  // Other services
  if (byService['captcha']) result['captcha'] = { total: byService['captcha'], count: 0 };
  if (byService['vercel']) result['vercel'] = { total: byService['vercel'], count: 0 };
  if (byService['browseruse']) result['browseruse'] = { total: byService['browseruse'], count: 0 };

  // Include any other services we might have missed
  for (const [service, total] of Object.entries(byService)) {
    if (!result[service]) {
      result[service] = { total: total as number };
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMO DATA (fallback when no real data)
// ═══════════════════════════════════════════════════════════════════════════

function getDemoPipelineData() {
  return {
    ideas: 47,
    validating: 5,
    building: 2,
    deployed: 3,
    revenue: 1,
    recentOpportunities: [
      {
        id: "demo-1",
        title: "AI-Powered Invoice Parser for Freelancers",
        source: "r/freelance",
        score: 85,
        discoveredAt: "2h ago",
      },
      {
        id: "demo-2",
        title: "Slack Bot for Standup Meeting Summaries",
        source: "r/SaaS",
        score: 78,
        discoveredAt: "5h ago",
      },
      {
        id: "demo-3",
        title: "Browser Extension for Research Note Taking",
        source: "Hacker News",
        score: 72,
        discoveredAt: "8h ago",
      },
    ],
    weeklyIdeas: 23,
    ideaGrowth: 15,
    highScoreIdeas: 4,
    falsePositiveRate: 25,
    pipelineValue: 15000,
  };
}

function getDemoAppsData() {
  return [
    {
      id: "demo-app-1",
      name: "TaskFlow Pro",
      mrr: 2450,
      customers: 127,
      arpu: 19,
      churnRate: 3.2,
      trialConversion: 24,
      revenueHistory: generateRevenueHistory(2450, 6),
      userHistory: generateUserHistory(450, 6),
      posthogProjectId: null,
    },
    {
      id: "demo-app-2",
      name: "InvoiceAI",
      mrr: 890,
      customers: 45,
      arpu: 20,
      churnRate: 5.1,
      trialConversion: 18,
      revenueHistory: generateRevenueHistory(890, 4),
      userHistory: generateUserHistory(180, 4),
      posthogProjectId: null,
    },
  ];
}

function getDemoContentData() {
  return [
    {
      id: "content-1",
      platform: "twitter" as const,
      content: "Just shipped a new feature that lets you parse invoices with AI in seconds.",
      status: "scheduled" as const,
      scheduledFor: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: "content-2",
      platform: "linkedin" as const,
      content: "The #1 productivity killer for freelancers? Invoice management.",
      status: "ready" as const,
      scheduledFor: new Date(Date.now() + 172800000).toISOString(),
    },
    {
      id: "content-3",
      platform: "twitter" as const,
      content: "Happy to announce TaskFlow Pro just hit 100 customers!",
      status: "posted" as const,
      scheduledFor: new Date(Date.now() - 86400000).toISOString(),
      engagement: { likes: 234, shares: 45, comments: 18 },
    },
  ];
}

function getDemoCostsData() {
  return {
    gemini: { total: 0, count: 50 }, // FREE tier
    deepseek: { total: 0.42, tokens: 3000000 }, // Super cheap
    glm: { total: 0.15, tokens: 1500000 }, // Cheapest
    claude: { total: 1.25, tokens: 500000 },
    openai: { total: 0.80, tokens: 400000 },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function generateRevenueHistory(startMrr: number, months: number) {
  const history = [];
  let mrr = startMrr * 0.3;
  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (months - i - 1));
    mrr = mrr * (1 + Math.random() * 0.2);
    history.push({
      date: date.toLocaleDateString("en-US", { month: "short" }),
      mrr: Math.round(mrr),
    });
  }
  return history;
}

function generateUserHistory(totalUsers: number, months: number) {
  const history = [];
  let users = Math.round(totalUsers * 0.2);
  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (months - i - 1));
    users = Math.round(users * (1 + Math.random() * 0.15));
    history.push({
      date: date.toLocaleDateString("en-US", { month: "short" }),
      users: users,
      active: Math.round(users * (0.4 + Math.random() * 0.3)),
    });
  }
  return history;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
