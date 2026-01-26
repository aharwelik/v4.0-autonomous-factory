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
import BuildAppVisual from "@/components/BuildAppVisual";
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
  Hammer,
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

  // Build visual state
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showBuildVisual, setShowBuildVisual] = useState(false);

  // Preflight check state
  const [preflightStatus, setPreflightStatus] = useState<{
    canBuild: boolean;
    canDeploy: boolean;
    status: { emoji: string; message: string; level: string };
    blockers: Array<{ name: string; key: string; howToGet: string; freeOption?: boolean }>;
    recommendations: Array<{ priority: number; message: string; url: string }>;
  } | null>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleSubmitIdea = async () => {
    if (!idea.trim()) return;

    // First check if we can build
    if (!preflightStatus?.canBuild) {
      addLog("");
      addLog("🔴 SETUP REQUIRED");
      addLog("═══════════════════════════════════════════════════════");
      addLog("You need to configure an AI API key before building.");
      addLog("");
      addLog("Missing:");
      preflightStatus?.blockers.forEach(b => {
        addLog(`   ❌ ${b.name}`);
        addLog(`      Get it here: ${b.howToGet}`);
      });
      addLog("");
      addLog("👇 Scroll down to 'Quick Setup' and add your API keys");
      return;
    }

    setIsProcessing(true);
    setLogs([]);

    // Phase 1: Understanding
    setCurrentPhase("understanding");
    addLog("🎯 STEP 1: Understanding Your Idea");
    addLog("═══════════════════════════════════════════════════════");
    addLog(`📝 Input: "${idea.slice(0, 100)}${idea.length > 100 ? "..." : ""}"`);
    addLog("");
    addLog("📤 Sending to AI for validation...");

    try {
      const response = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          runInBackground,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.needsSetup) {
          setCurrentPhase("ready");
          addLog("");
          addLog("🔴 API KEY REQUIRED");
          addLog("═══════════════════════════════════════════════════════");
          addLog(result.error);
          addLog("");
          addLog("👇 Scroll down to 'Quick Setup' and add your Gemini API key (FREE!)");
          setIsProcessing(false);
          fetchPreflight(); // Refresh status
          return;
        }
        throw new Error(result.error || "Build failed");
      }

      // Phase 2: Show validation results
      setCurrentPhase("validation");
      addLog("✅ AI Response Received!");
      addLog("");
      addLog("🔍 STEP 2: Validation Results");
      addLog("═══════════════════════════════════════════════════════");
      addLog(`💾 Idea ID: ${result.ideaId}`);
      addLog("");

      if (result.validation) {
        // Score with visual bar
        const score = result.validation.score || 0;
        const scoreBar = "█".repeat(Math.floor(score / 10)) + "░".repeat(10 - Math.floor(score / 10));
        addLog(`📊 Score: [${scoreBar}] ${score}/100`);
        addLog("");

        addLog("📋 Analysis Details:");
        addLog(`   🎯 Target Audience: ${result.validation.targetAudience || "N/A"}`);
        addLog(`   💰 Suggested Price: $${result.validation.targetPrice || 19}/month`);
        addLog(`   🏗️ Complexity: ${result.validation.buildComplexity || "medium"}`);
        addLog(`   📈 Recommendation: ${result.validation.recommendation || "CONSIDER"}`);

        if (result.validation.competitors?.length > 0) {
          addLog("");
          addLog("🏢 Competitors Found:");
          result.validation.competitors.forEach((c: string) => addLog(`   • ${c}`));
        }

        if (result.validation.concerns?.length > 0) {
          addLog("");
          addLog("⚠️ Concerns to Address:");
          result.validation.concerns.forEach((c: string) => addLog(`   • ${c}`));
        }

        if (result.validation.coreFeatures?.length > 0) {
          addLog("");
          addLog("✨ Core Features to Build:");
          result.validation.coreFeatures.forEach((f: string) => addLog(`   • ${f}`));
        }

        if (result.validation.appName) {
          addLog("");
          addLog(`📱 Suggested App Name: "${result.validation.appName}"`);
          if (result.validation.tagline) {
            addLog(`   "${result.validation.tagline}"`);
          }
        }
      }

      // Phase 3: Show next steps based on result
      addLog("");
      setCurrentPhase("ready");

      if (result.phase === "queued") {
        addLog("🚀 STEP 3: Build Queued!");
        addLog("═══════════════════════════════════════════════════════");
        addLog("");
        addLog(`🔧 Job ID: ${result.jobId}`);
        addLog(`🤖 AI Provider: ${result.validation?.provider || "Gemini"}`);
        addLog("");
        addLog("📦 What's Happening Now:");
        addLog("   1. AI is generating app specification...");
        addLog("   2. Creating all code files...");
        addLog("   3. Setting up project structure...");
        addLog("   4. Saving to /generated-apps/");
        addLog("");
        addLog("👉 Click the 'Build' tab below to watch live progress!");
        addLog("");

        if (!preflightStatus?.canDeploy) {
          addLog("💡 TIP: Add Vercel token in Setup for auto-deployment");
        }

        // Set job ID for visual tracking
        setActiveJobId(result.jobId);
        setShowBuildVisual(true);

      } else if (result.phase === "validation" && !result.validation?.isViable) {
        addLog("❌ IDEA DID NOT PASS VALIDATION");
        addLog("═══════════════════════════════════════════════════════");
        addLog("");
        addLog("The AI thinks this idea may struggle to reach $10k MRR.");
        addLog("");
        addLog("💡 Suggestions:");
        addLog("   • Make the target audience more specific");
        addLog("   • Focus on a unique angle competitors miss");
        addLog("   • Consider a higher price point for premium features");
        addLog("");
        addLog("Try refining your idea and submit again!");

      } else {
        addLog("✅ VALIDATION COMPLETE");
        addLog("═══════════════════════════════════════════════════════");
        addLog("");
        addLog("Your idea passed validation!");
        if (result.buildCommand) {
          addLog("");
          addLog("To build manually, run:");
          addLog(`   ${result.buildCommand}`);
        }
      }

    } catch (error) {
      setCurrentPhase("ready");
      addLog("");
      addLog("❌ ERROR OCCURRED");
      addLog("═══════════════════════════════════════════════════════");
      addLog(error instanceof Error ? error.message : "Unknown error");
      addLog("");
      addLog("💡 Troubleshooting:");
      addLog("   • Check your API key is valid in Setup");
      addLog("   • Try refreshing the page");
      addLog("   • Check browser console for details");
    }

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

  // Fetch preflight status
  const fetchPreflight = async () => {
    try {
      const res = await fetch("/api/preflight");
      const data = await res.json();
      if (data.success) {
        setPreflightStatus(data);
      }
    } catch (error) {
      console.error("Preflight check failed:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPreflight();
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
        onSettingsChange={() => {
          fetchData();
          fetchPreflight();
        }}
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

          {/* PREFLIGHT STATUS - SHOW WHAT'S NEEDED */}
          {preflightStatus && !preflightStatus.canBuild && (
            <Card className="bg-red-950/50 border-red-500/50 mb-4">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-red-300 mb-2">
                      {preflightStatus.status.emoji} {preflightStatus.status.message}
                    </h3>
                    <div className="space-y-2">
                      {preflightStatus.blockers.map((blocker) => (
                        <div key={blocker.key} className="flex items-center justify-between bg-red-900/30 rounded-lg p-3">
                          <div>
                            <span className="text-white font-medium">{blocker.name}</span>
                            {blocker.freeOption && (
                              <Badge className="ml-2 bg-green-600">FREE</Badge>
                            )}
                          </div>
                          <a
                            href={blocker.howToGet}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
                          >
                            Get Key →
                          </a>
                        </div>
                      ))}
                    </div>
                    <p className="text-red-300/80 text-sm mt-3">
                      👇 Scroll down to "Quick Setup" to add your API keys
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PREFLIGHT STATUS - PARTIAL (can build, can't deploy) */}
          {preflightStatus && preflightStatus.canBuild && !preflightStatus.canDeploy && (
            <Card className="bg-yellow-950/30 border-yellow-500/30 mb-4">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-yellow-300 text-sm">
                  <span>{preflightStatus.status.emoji}</span>
                  <span>{preflightStatus.status.message}</span>
                  <span className="text-yellow-400/60 ml-2">
                    (Add Vercel token below for auto-deploy)
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PREFLIGHT STATUS - ALL GOOD */}
          {preflightStatus && preflightStatus.canBuild && preflightStatus.canDeploy && (
            <Card className="bg-green-950/30 border-green-500/30 mb-4">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-green-300 text-sm">
                  <span>{preflightStatus.status.emoji}</span>
                  <span>{preflightStatus.status.message}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* THE MAIN INPUT - THIS IS THE #1 FEATURE */}
          <Card className={`bg-card/50 backdrop-blur border-2 ${
            preflightStatus?.canBuild ? "border-primary/20" : "border-red-500/30"
          }`}>
            <CardContent className="p-6">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder={preflightStatus?.canBuild
                  ? `Describe your app idea in detail...

Example: "A tool that helps freelancers track time and invoice clients.
Should have a timer, project management, and Stripe integration for payments.
Target: Freelance designers making $50k-100k/year. Price: $19/month."`
                  : `⚠️ Setup required before you can build apps.

Add your Gemini API key (FREE!) in the Quick Setup section below.
Then come back here and describe your app idea.`
                }
                className="w-full h-36 bg-background border border-input rounded-lg p-4 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                disabled={isProcessing || !preflightStatus?.canBuild}
              />

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  {preflightStatus?.canBuild
                    ? "Include: problem, target user, price point, key features"
                    : "👇 Complete setup below first"
                  }
                </div>
                <Button
                  onClick={handleSubmitIdea}
                  disabled={isProcessing || !idea.trim() || !preflightStatus?.canBuild}
                  size="lg"
                  className="gap-2"
                >
                  <Rocket className="w-5 h-5" />
                  {!preflightStatus?.canBuild
                    ? "Setup Required"
                    : isProcessing
                    ? "Processing..."
                    : "Build This App →"
                  }
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
          <SetupGuide onKeySaved={fetchPreflight} />
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

        <Tabs defaultValue={showBuildVisual ? "build" : "pipeline"} className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="build" className="gap-2">
              <Hammer className="w-4 h-4" />
              Build
              {activeJobId && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            </TabsTrigger>
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

          <TabsContent value="build">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hammer className="w-5 h-5" />
                  Build Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {idea ? (
                  <BuildAppVisual
                    jobId={activeJobId || undefined}
                    idea={idea}
                    onComplete={(result) => {
                      if (result.success) {
                        addLog(`✅ App built: ${result.appName}`);
                        setActiveJobId(null);
                        fetchData();
                      }
                    }}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Rocket className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Enter an idea above and click "Build This App" to see the build progress here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
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
