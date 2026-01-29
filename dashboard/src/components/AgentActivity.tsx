"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Search,
  Hammer,
  Rocket,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface JobActivity {
  id: string;
  agent: string;
  icon: string;
  type: string;
  status: string;
  task: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

interface JobStats {
  total: number;
  running: number;
  queued: number;
  completed: number;
  failed: number;
}

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  hammer: Hammer,
  check: CheckCircle,
  rocket: Rocket,
  search: Search,
  "file-text": FileText,
  bot: Bot,
};

// Status colors and icons
const statusConfig: Record<string, { color: string; textColor: string; icon: React.ReactNode }> = {
  running: {
    color: "bg-blue-500",
    textColor: "text-blue-500",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  queued: {
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    icon: <Clock className="w-3 h-3" />,
  },
  completed: {
    color: "bg-green-500",
    textColor: "text-green-500",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  failed: {
    color: "bg-red-500",
    textColor: "text-red-500",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export function AgentActivity() {
  const [activities, setActivities] = useState<JobActivity[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs?limit=20");
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Jobs</div>
          </Card>
          <Card className="p-3 text-center border-blue-500/30">
            <div className="text-2xl font-bold text-blue-500">{stats.running}</div>
            <div className="text-xs text-muted-foreground">Running</div>
          </Card>
          <Card className="p-3 text-center border-yellow-500/30">
            <div className="text-2xl font-bold text-yellow-500">{stats.queued}</div>
            <div className="text-xs text-muted-foreground">Queued</div>
          </Card>
          <Card className="p-3 text-center border-green-500/30">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </Card>
          <Card className="p-3 text-center border-red-500/30">
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </Card>
        </div>
      )}

      {/* Activity List */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <Button variant="ghost" size="sm" onClick={fetchJobs}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {activities.length === 0 ? (
        <Card className="p-8 text-center">
          <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No agent activity yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Submit an idea above to start building.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = iconMap[activity.icon] || Bot;
            const status = statusConfig[activity.status] || statusConfig.queued;

            return (
              <Card key={activity.id} className={`${
                activity.status === "running" ? "border-blue-500/30" :
                activity.status === "failed" ? "border-red-500/30" : ""
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Status indicator */}
                    <div className={`mt-1 w-2 h-2 rounded-full ${status.color} ${
                      activity.status === "running" ? "animate-pulse" : ""
                    }`} />

                    {/* Agent icon */}
                    <Icon className={`w-5 h-5 ${status.textColor}`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{activity.agent}</span>
                        <Badge variant={
                          activity.status === "running" ? "default" :
                          activity.status === "completed" ? "outline" :
                          activity.status === "failed" ? "destructive" :
                          "secondary"
                        } className="gap-1">
                          {status.icon}
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {activity.task}
                      </p>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span>Started {formatTimeAgo(activity.startedAt)}</span>
                        {activity.completedAt && (
                          <span>• Completed {formatTimeAgo(activity.completedAt)}</span>
                        )}
                      </div>
                      {activity.error && (
                        <p className="text-xs text-red-400 mt-1">{activity.error}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
