"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  TrendingUp,
  RefreshCw,
  Eye,
  Play,
  Pause,
  Settings as SettingsIcon,
  Activity,
  Signal,
} from "lucide-react";

interface AutoDiscoveredIdea {
  id: string;
  title: string;
  description: string;
  source: string;
  score: number;
  signal_count: number;
  search_growth: number;
  status: string;
  created_at: string;
  signals: Array<{
    type: string;
    source: string;
    score: number;
    sentiment?: string;
    created_at: string;
  }>;
}

interface DiscoveryStatus {
  serviceEnabled: boolean;
  serviceRunning: boolean;
  lastRun: string | null;
  lastResult: {
    discovered: number;
    signals: number;
    error?: string;
  } | null;
  nextRun: string | null;
  autoDiscoveredCount: number;
  topIdeas: Array<{
    id: string;
    title: string;
    score: number;
    signal_count: number;
    source: string;
  }>;
}

export function AutoDiscoveredIdeas() {
  const [status, setStatus] = useState<DiscoveryStatus | null>(null);
  const [ideas, setIdeas] = useState<AutoDiscoveredIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const response = await fetch("/api/auto-discover");
      if (!response.ok) throw new Error("Failed to load status");

      const data = await response.json();
      setStatus(data.summary);
    } catch (error) {
      console.error("Failed to load discovery status:", error);
    }
  };

  const loadIdeas = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auto-discover?action=ideas&limit=20");
      if (!response.ok) throw new Error("Failed to load ideas");

      const data = await response.json();
      setIdeas(data.ideas || []);
    } catch (error) {
      console.error("Failed to load auto-discovered ideas:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerScan = async () => {
    setTriggering(true);
    try {
      const response = await fetch("/api/auto-discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger" }),
      });

      if (!response.ok) throw new Error("Scan failed");

      await Promise.all([loadStatus(), loadIdeas()]);
    } catch (error) {
      console.error("Failed to trigger scan:", error);
    } finally {
      setTriggering(false);
    }
  };

  const toggleService = async () => {
    if (!status) return;

    const action = status.serviceRunning ? "stop" : "start";

    try {
      const response = await fetch("/api/auto-discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error("Failed to toggle service");

      await loadStatus();
    } catch (error) {
      console.error("Failed to toggle service:", error);
    }
  };

  useEffect(() => {
    loadStatus();
    loadIdeas();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Service Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-purple-500" />
              24/7 Discovery Engine
              <Badge
                variant={status?.serviceRunning ? "default" : "outline"}
                className="text-xs font-normal"
              >
                {status?.serviceRunning ? "Running" : "Stopped"}
              </Badge>
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={triggerScan}
                disabled={triggering}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${triggering ? "animate-spin" : ""}`} />
                {triggering ? "Scanning..." : "Scan Now"}
              </Button>

              <Button
                variant={status?.serviceRunning ? "destructive" : "default"}
                size="sm"
                onClick={toggleService}
                className="gap-2"
              >
                {status?.serviceRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">
                {status?.autoDiscoveredCount || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Discovered
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold">
                {status?.lastResult?.discovered || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Last Scan
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold">
                {status?.lastResult?.signals || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Signals Collected
              </div>
            </div>

            <div>
              <div className="text-sm font-medium">
                {status?.lastRun ? formatTimeAgo(status.lastRun) : "Never"}
              </div>
              <div className="text-sm text-muted-foreground">
                Last Run
              </div>
            </div>
          </div>

          {status?.lastResult?.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              Error: {status.lastResult.error}
            </div>
          )}

          {status?.nextRun && status.serviceRunning && (
            <div className="mt-4 text-xs text-muted-foreground">
              Next automatic scan: {status.nextRun}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Discovered Ideas List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Auto-Discovered Ideas
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading && ideas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p>Loading ideas...</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No auto-discovered ideas yet.</p>
              <p className="text-sm">Click "Scan Now" to start discovering opportunities.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {idea.source}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Signal className="w-3 h-3" />
                          <span>{idea.signal_count} signals</span>
                        </div>
                        {idea.search_growth > 0 && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <TrendingUp className="w-3 h-3" />
                            <span>+{idea.search_growth.toFixed(1)}%</span>
                          </div>
                        )}
                        <Badge
                          variant={
                            idea.status === "new"
                              ? "default"
                              : idea.status === "validating"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {idea.status}
                        </Badge>
                      </div>

                      <h4 className="font-medium text-sm mb-1">{idea.title}</h4>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {idea.description}
                      </p>

                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Opportunity Score</span>
                          <span className="font-medium">{idea.score}/100</span>
                        </div>
                        <Progress value={idea.score} className="h-2" />
                      </div>

                      {expandedId === idea.id && idea.signals.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Signals ({idea.signals.length}):
                          </div>
                          {idea.signals.slice(0, 3).map((signal, idx) => (
                            <div
                              key={idx}
                              className="text-xs p-2 bg-muted/50 rounded"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {signal.type}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {signal.source}
                                </span>
                              </div>
                              {signal.sentiment && (
                                <div className="text-muted-foreground">
                                  Sentiment: {signal.sentiment}
                                </div>
                              )}
                            </div>
                          ))}
                          {idea.signals.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              + {idea.signals.length - 3} more signals
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setExpandedId(expandedId === idea.id ? null : idea.id)
                        }
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        {expandedId === idea.id ? "Hide" : "View"}
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mt-2">
                    Discovered {formatTimeAgo(idea.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
