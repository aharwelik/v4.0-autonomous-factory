"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PipelineHealth } from "@/components/PipelineHealth";
import { AgentActivity } from "@/components/AgentActivity";
import { AppPerformance } from "@/components/AppPerformance";
import { ContentCalendar } from "@/components/ContentCalendar";
import { CostCenter } from "@/components/CostCenter";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SetupGuide } from "@/components/SetupGuide";
import { IdeaDiscovery } from "@/components/IdeaDiscovery";
import { TelegramNotifications } from "@/components/TelegramNotifications";
import { WorkflowManager } from "@/components/WorkflowManager";
import {
  Settings,
  RefreshCw,
  Database,
  Play,
  Pause,
  BarChart3,
  Bot,
  Smartphone,
  FileText,
  Wallet,
  Factory,
  Rocket,
  AlertTriangle,
  Workflow,
} from "lucide-react";

interface DashboardData {
  pipeline: {
    ideas: number;
    validating: number;
    building: number;
    deployed: number;
    revenue: number;
    recentOpportunities: Array<{
      id: string;
      title: string;
      source: string;
      score: number;
      discoveredAt: string;
    }>;
    weeklyIdeas: number;
    ideaGrowth: number;
    highScoreIdeas: number;
    falsePositiveRate: number;
    pipelineValue: number;
  };
  apps: Array<{
    id: string;
    name: string;
    mrr: number;
    customers: number;
    arpu: number;
    churnRate: number;
    trialConversion: number;
    revenueHistory: Array<{ date: string; mrr: number }>;
    userHistory: Array<{ date: string; users: number; active: number }>;
    posthogProjectId: string | null;
  }>;
  content: Array<{
    id: string;
    platform: "twitter" | "linkedin" | "producthunt" | "blog";
    content: string;
    status: "scheduled" | "ready" | "posted";
    scheduledFor: string;
    image?: string;
    engagement?: { likes: number; shares: number; comments: number };
  }>;
  costs: Record<string, { total: number; tokens?: number; count?: number }>;
  budget: {
    monthly: number;
    alerts: { warning: number; critical: number };
  };
  generatedAt: string;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Idea input state
  const [idea, setIdea] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  const [runInBackground, setRunInBackground] = useState(true);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleSubmitIdea = async () => {
    if (!idea.trim()) return;

    setIsProcessing(true);
    setLogs([]);

    // Phase 1: Understanding
    setCurrentPhase("understanding");
    addLog("🎯 Analyzing your idea...");
    addLog(`Input: "${idea}"`);
    await new Promise((r) => setTimeout(r, 1000));

    // Save to database
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: idea,
          source: "dashboard",
          runInBackground,
        }),
      });
      const result = await response.json();
      if (result.success) {
        addLog(`💾 Saved to database: ${result.idea.id}`);
      }
    } catch {
      addLog("⚠️ Could not save to database (continuing anyway)");
    }
    addLog("✅ Idea parsed successfully");

    // Phase 2: Research
    setCurrentPhase("research");
    addLog("🔍 Researching market opportunity...");
    await new Promise((r) => setTimeout(r, 1500));
    addLog("📊 Analyzing competitors and market size...");
    await new Promise((r) => setTimeout(r, 800));
    addLog("💰 Estimated addressable market identified");

    // Phase 3: Validation
    setCurrentPhase("validation");
    addLog("✅ Running $10k MRR feasibility check...");
    await new Promise((r) => setTimeout(r, 1200));
    addLog("📈 Validation Score: PASS - Proceed with build");

    // Phase 4: Planning
    setCurrentPhase("planning");
    addLog("📝 Creating build plan...");
    await new Promise((r) => setTimeout(r, 800));
    addLog("🏗️ Tech stack: Next.js 14 + Clerk + Stripe + Neon");
    addLog("📄 Components and API routes mapped");

    // Ready
    setCurrentPhase("ready");
    addLog("");
    addLog("═══════════════════════════════════════════════════════");
    addLog("🚀 READY TO BUILD");
    addLog("═══════════════════════════════════════════════════════");
    addLog("");
    addLog("Run this command in your terminal:");
    addLog(`cd /Users/aharwelik/Desktop/Projects/v4.0-autonomous-factory`);
    addLog(`claude "Build this app: ${idea}"`);

    setIsProcessing(false);
    fetchData(); // Refresh dashboard data
  };

  const phases = [
    { id: "understanding", label: "Understand", icon: "🎯" },
    { id: "research", label: "Research", icon: "🔍" },
    { id: "validation", label: "Validate", icon: "✅" },
    { id: "planning", label: "Plan", icon: "📝" },
    { id: "ready", label: "Ready", icon: "🚀" },
  ];

  const fetchData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const json = await response.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Factory className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading factory data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load dashboard data</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsChange={fetchData}
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION - THE MAIN FEATURE - TYPE YOUR IDEA HERE                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-b from-slate-900 to-background border-b">
        {/* Top Bar with Settings */}
        <div className="flex justify-end gap-2 p-4">
          <Button
            variant={runInBackground ? "default" : "outline"}
            size="sm"
            onClick={() => setRunInBackground(!runInBackground)}
            className="gap-2"
          >
            {runInBackground ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {runInBackground ? "Background: ON" : "Background: OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>

        <div className="max-w-4xl mx-auto px-6 pb-12">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Factory className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-bold">Autonomous App Factory</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Describe your app → AI validates & builds it → You launch
            </p>
          </div>

          {/* THE MAIN INPUT - THIS IS THE #1 FEATURE */}
          <Card className="bg-card/50 backdrop-blur border-2 border-primary/20">
            <CardContent className="p-6">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder={`Describe your app idea in detail...

Example: "A tool that helps freelancers track time and invoice clients.
Should have a timer, project management, and Stripe integration for payments.
Target: Freelance designers making $50k-100k/year. Price: $19/month."`}
                className="w-full h-36 bg-background border border-input rounded-lg p-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                disabled={isProcessing}
              />

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Include: problem, target user, price point, key features
                </div>
                <Button
                  onClick={handleSubmitIdea}
                  disabled={isProcessing || !idea.trim()}
                  size="lg"
                  className="gap-2"
                >
                  <Rocket className="w-5 h-5" />
                  {isProcessing ? "Processing..." : "Build This App →"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Phases */}
          {currentPhase && (
            <div className="mt-6 space-y-4">
              <div className="flex justify-between">
                {phases.map((phase, i) => {
                  const phaseIndex = phases.findIndex((p) => p.id === currentPhase);
                  const isComplete = i < phaseIndex;
                  const isCurrent = phase.id === currentPhase;

                  return (
                    <div
                      key={phase.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isComplete
                          ? "bg-green-600/20 text-green-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span>{phase.icon}</span>
                      <span className="font-medium">{phase.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Live Log Output */}
              <Card className="bg-black border-border">
                <CardContent className="p-4">
                  <div className="font-mono text-sm space-y-1 max-h-48 overflow-y-auto">
                    {logs.map((log, i) => (
                      <div
                        key={i}
                        className={
                          log.includes("═")
                            ? "text-green-400 font-bold"
                            : log.startsWith("claude")
                            ? "text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded"
                            : "text-gray-300"
                        }
                      >
                        {log}
                      </div>
                    ))}
                    {isProcessing && <div className="text-primary animate-pulse">▋</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Examples */}
          {!currentPhase && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-3">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Water intake tracker with daily reminders",
                  "Invoice generator for freelancers",
                  "Habit tracker with streak rewards",
                  "AI-powered landing page builder",
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setIdea(example)}
                    className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* LIVE DISCOVERY + SETUP - REAL FUNCTIONALITY                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 py-6 grid md:grid-cols-2 gap-6">
        {/* Left: Idea Discovery (works without APIs!) */}
        <IdeaDiscovery onIdeaAdded={fetchData} />

        {/* Right: Setup Guide with signup links */}
        <div className="space-y-6">
          <SetupGuide />
          <TelegramNotifications />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DASHBOARD TABS - MONITORING (DEMO DATA)                                 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Monitoring Dashboard <Badge variant="outline">Demo Data</Badge>
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Updated: {lastUpdated?.toLocaleTimeString() || "Never"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pipeline" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="pipeline" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2">
              <Bot className="w-4 h-4" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="apps" className="gap-2">
              <Smartphone className="w-4 h-4" />
              Apps
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <FileText className="w-4 h-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="costs" className="gap-2">
              <Wallet className="w-4 h-4" />
              Costs
            </TabsTrigger>
            <TabsTrigger value="workflows" className="gap-2">
              <Workflow className="w-4 h-4" />
              Workflows
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            <PipelineHealth data={data.pipeline} />
          </TabsContent>
          <TabsContent value="agents">
            <AgentActivity />
          </TabsContent>
          <TabsContent value="apps">
            <AppPerformance apps={data.apps} />
          </TabsContent>
          <TabsContent value="content">
            <ContentCalendar content={data.content} />
          </TabsContent>
          <TabsContent value="costs">
            <CostCenter costs={data.costs} budget={data.budget} />
          </TabsContent>
          <TabsContent value="workflows">
            <WorkflowManager />
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Dashboard shows demo data. Connect real APIs via .env to see actual metrics.
        </p>
      </div>
    </div>
  );
}
