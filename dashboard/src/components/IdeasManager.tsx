"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  RefreshCw,
  Trash2,
  Play,
  ExternalLink,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Rocket,
  Code,
  Globe,
  RotateCcw,
  Eye,
} from "lucide-react";

/**
 * IDEAS MANAGER
 *
 * Shows:
 * 1. History dropdown (last 10 ideas for quick reuse)
 * 2. Active ideas grid (up to 30 ideas being managed)
 * 3. Status, actions, and quick access to built apps
 */

interface Idea {
  id: string;
  title: string;
  description?: string;
  source?: string;
  score: number;
  status: string;
  validation_result?: string;
  build_job_id?: string;
  app_id?: string;
  deploy_url?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

interface IdeasManagerProps {
  onSelectIdea?: (idea: string) => void;
  onRefresh?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: "New", color: "bg-gray-500", icon: <Lightbulb className="w-3 h-3" /> },
  validating: { label: "Validating", color: "bg-blue-500", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  validated: { label: "Validated", color: "bg-green-500", icon: <CheckCircle className="w-3 h-3" /> },
  queued: { label: "Queued", color: "bg-yellow-500", icon: <Clock className="w-3 h-3" /> },
  building: { label: "Building", color: "bg-purple-500", icon: <Code className="w-3 h-3 animate-pulse" /> },
  built: { label: "Built", color: "bg-emerald-500", icon: <Code className="w-3 h-3" /> },
  deploying: { label: "Deploying", color: "bg-orange-500", icon: <Rocket className="w-3 h-3 animate-bounce" /> },
  deployed: { label: "Deployed", color: "bg-green-600", icon: <Globe className="w-3 h-3" /> },
  rejected: { label: "Rejected", color: "bg-red-500", icon: <XCircle className="w-3 h-3" /> },
  failed: { label: "Failed", color: "bg-red-600", icon: <AlertCircle className="w-3 h-3" /> },
};

export function IdeasManager({ onSelectIdea, onRefresh }: IdeasManagerProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Fetch ideas
  const fetchIdeas = useCallback(async () => {
    try {
      const res = await fetch("/api/ideas");
      const data = await res.json();
      if (data.success) {
        setIdeas(data.ideas || []);
      }
    } catch (err) {
      console.error("Failed to fetch ideas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
    // Poll every 5 seconds for status updates
    const interval = setInterval(fetchIdeas, 5000);
    return () => clearInterval(interval);
  }, [fetchIdeas]);

  // Delete idea
  const deleteIdea = async (id: string) => {
    if (!confirm("Delete this idea? This cannot be undone.")) return;

    try {
      await fetch(`/api/ideas/${id}`, { method: "DELETE" });
      setIdeas(prev => prev.filter(i => i.id !== id));
      if (selectedIdea?.id === id) setSelectedIdea(null);
    } catch (err) {
      console.error("Failed to delete idea:", err);
    }
  };

  // Retry failed idea
  const retryIdea = async (idea: Idea) => {
    if (onSelectIdea && idea.description) {
      onSelectIdea(idea.description);
    }
  };

  // Get last 10 ideas for history dropdown
  const historyIdeas = ideas.slice(0, 10);

  // Filter ideas
  const filteredIdeas = ideas.filter(idea => {
    if (filter === "all") return true;
    if (filter === "active") return ["validating", "queued", "building", "deploying"].includes(idea.status);
    if (filter === "completed") return ["validated", "built", "deployed"].includes(idea.status);
    if (filter === "failed") return ["rejected", "failed"].includes(idea.status);
    return idea.status === filter;
  }).slice(0, 30); // Max 30 active

  // Stats
  const stats = {
    total: ideas.length,
    active: ideas.filter(i => ["validating", "queued", "building", "deploying"].includes(i.status)).length,
    completed: ideas.filter(i => ["deployed", "built"].includes(i.status)).length,
    failed: ideas.filter(i => ["rejected", "failed"].includes(i.status)).length,
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
    return (
      <Badge className={`${config.color} text-white text-xs gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Ideas Manager
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{stats.total} total</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { fetchIdeas(); onRefresh?.(); }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-4 mt-2 text-sm">
          <span className="text-blue-400">{stats.active} active</span>
          <span className="text-green-400">{stats.completed} completed</span>
          <span className="text-red-400">{stats.failed} failed</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* History Dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setShowHistory(!showHistory)}
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Ideas (click to reuse)
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </Button>

          {showHistory && historyIdeas.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {historyIdeas.map((idea) => (
                <button
                  key={idea.id}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                  onClick={() => {
                    if (onSelectIdea && idea.description) {
                      onSelectIdea(idea.description);
                    }
                    setShowHistory(false);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate max-w-[70%]">
                      {idea.title}
                    </span>
                    {getStatusBadge(idea.status)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span>{formatDate(idea.created_at)}</span>
                    {idea.score > 0 && <span>• Score: {idea.score}/100</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "completed", label: "Completed" },
            { key: "failed", label: "Failed" },
          ].map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Ideas Grid */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading ideas...
            </div>
          ) : filteredIdeas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No ideas yet. Enter one above to get started!</p>
            </div>
          ) : (
            filteredIdeas.map((idea) => (
              <div
                key={idea.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedIdea?.id === idea.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedIdea(selectedIdea?.id === idea.id ? null : idea)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {idea.title}
                      </span>
                      {getStatusBadge(idea.status)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span>{formatDate(idea.created_at)}</span>
                      {idea.score > 0 && (
                        <span className={idea.score >= 70 ? "text-green-400" : idea.score >= 50 ? "text-yellow-400" : "text-red-400"}>
                          Score: {idea.score}/100
                        </span>
                      )}
                      {idea.source && <span>• {idea.source}</span>}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1">
                    {idea.deploy_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(idea.deploy_url, "_blank");
                        }}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                    {["rejected", "failed"].includes(idea.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          retryIdea(idea);
                        }}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteIdea(idea.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedIdea?.id === idea.id && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    {idea.description && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Full Idea:</span>
                        <p className="text-sm mt-1">{idea.description}</p>
                      </div>
                    )}

                    {idea.validation_result && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Validation:</span>
                        <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(JSON.parse(idea.validation_result), null, 2).slice(0, 500)}
                        </pre>
                      </div>
                    )}

                    {idea.error && (
                      <div className="text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        {idea.error}
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      {idea.description && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectIdea?.(idea.description!)}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Reuse
                        </Button>
                      )}
                      {idea.app_id && (
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View App
                        </Button>
                      )}
                      {idea.deploy_url && (
                        <Button
                          size="sm"
                          onClick={() => window.open(idea.deploy_url, "_blank")}
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          Open Live
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
