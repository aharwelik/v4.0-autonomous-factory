"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  Search,
  Hammer,
  Megaphone,
  Activity,
  AlertCircle
} from "lucide-react";

interface SubAgent {
  name: string;
  status: "running" | "idle" | "completed" | "error";
}

interface Agent {
  name: string;
  status: "working" | "idle" | "error";
  currentTask: string | null;
  progress: number;
  subagents: SubAgent[];
  costToday: number;
}

interface LogEntry {
  time: string;
  agent: string;
  message: string;
  level: "info" | "error" | "warning" | "success";
}

// Mock initial data
const initialAgents: Agent[] = [
  {
    name: "orchestrator",
    status: "working",
    currentTask: "Coordinating agent tasks",
    progress: 100,
    subagents: [],
    costToday: 0.45,
  },
  {
    name: "researcher",
    status: "working",
    currentTask: "Scanning Reddit for opportunities",
    progress: 67,
    subagents: [
      { name: "reddit-scanner", status: "running" },
      { name: "trend-analyzer", status: "idle" },
      { name: "competitor-checker", status: "completed" },
    ],
    costToday: 2.15,
  },
  {
    name: "builder",
    status: "idle",
    currentTask: null,
    progress: 0,
    subagents: [
      { name: "frontend", status: "idle" },
      { name: "backend", status: "idle" },
      { name: "database", status: "idle" },
    ],
    costToday: 0.0,
  },
  {
    name: "marketer",
    status: "working",
    currentTask: "Generating Twitter content",
    progress: 45,
    subagents: [
      { name: "content-writer", status: "running" },
      { name: "image-generator", status: "idle" },
    ],
    costToday: 1.20,
  },
  {
    name: "operator",
    status: "idle",
    currentTask: null,
    progress: 0,
    subagents: [],
    costToday: 0.05,
  },
];

const initialLogs: LogEntry[] = [
  { time: "14:32:05", agent: "researcher", message: "Found 3 new opportunities on r/SaaS", level: "success" },
  { time: "14:31:42", agent: "orchestrator", message: "Starting daily research cycle", level: "info" },
  { time: "14:30:18", agent: "marketer", message: "Scheduled 5 tweets for tomorrow", level: "success" },
  { time: "14:28:55", agent: "researcher", message: "Analyzing competitor: TaskFlow Pro", level: "info" },
  { time: "14:25:33", agent: "operator", message: "Health check passed for all apps", level: "info" },
];

const agentIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  orchestrator: Bot,
  researcher: Search,
  builder: Hammer,
  marketer: Megaphone,
  operator: Activity,
};

const agentColors: Record<string, string> = {
  orchestrator: "bg-purple-500",
  researcher: "bg-blue-500",
  builder: "bg-green-500",
  marketer: "bg-orange-500",
  operator: "bg-red-500",
};

const agentTextColors: Record<string, string> = {
  orchestrator: "text-purple-500",
  researcher: "text-blue-500",
  builder: "text-green-500",
  marketer: "text-orange-500",
  operator: "text-red-500",
};

export function AgentActivity() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);

  // Simulate real-time updates (mock WebSocket behavior)
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update agent progress
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.status === "working" && agent.progress < 100) {
            return {
              ...agent,
              progress: Math.min(agent.progress + Math.random() * 5, 100),
            };
          }
          return agent;
        })
      );

      // Occasionally add a new log entry
      if (Math.random() > 0.7) {
        const messages = [
          { agent: "researcher", message: "Scanning new subreddit...", level: "info" as const },
          { agent: "marketer", message: "Generated new content piece", level: "success" as const },
          { agent: "orchestrator", message: "Task queue updated", level: "info" as const },
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const newLog: LogEntry = {
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          ...randomMessage,
        };
        setLogs((prev) => [newLog, ...prev].slice(0, 100));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Agent Status Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active Agents</h3>
        {agents.map((agent) => {
          const Icon = agentIcons[agent.name] || Bot;
          return (
            <Card key={agent.name}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${agentColors[agent.name]} ${
                        agent.status === "working" ? "animate-pulse" : ""
                      }`}
                    />
                    <Icon className={`w-5 h-5 ${agentTextColors[agent.name]}`} />
                    <div>
                      <div className="font-medium capitalize">{agent.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {agent.currentTask || "Idle"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        agent.status === "working"
                          ? "default"
                          : agent.status === "error"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {agent.status}
                    </Badge>
                    {agent.progress > 0 && agent.progress < 100 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {Math.round(agent.progress)}%
                      </div>
                    )}
                  </div>
                </div>

                {agent.progress > 0 && agent.progress < 100 && (
                  <Progress value={agent.progress} className="mt-3 h-2" />
                )}

                {/* Subagents */}
                {agent.subagents.length > 0 && (
                  <div className="mt-3 pl-6 space-y-2 border-l-2 border-muted ml-1">
                    {agent.subagents.map((sub) => (
                      <div
                        key={sub.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">{sub.name}</span>
                        <span
                          className={
                            sub.status === "running"
                              ? "text-green-500"
                              : sub.status === "error"
                              ? "text-red-500"
                              : "text-muted-foreground"
                          }
                        >
                          {sub.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cost for this agent today */}
                <div className="mt-3 text-xs text-muted-foreground">
                  Today&apos;s cost: ${agent.costToday.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity Log */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Live Activity</h3>
        <Card className="h-[600px] overflow-hidden">
          <CardContent className="p-0">
            <div className="h-full overflow-y-auto p-4 font-mono text-sm">
              {logs.map((log, i) => (
                <div
                  key={`${log.time}-${i}`}
                  className={`py-1 ${
                    log.level === "error"
                      ? "text-red-500"
                      : log.level === "warning"
                      ? "text-yellow-500"
                      : log.level === "success"
                      ? "text-green-500"
                      : ""
                  }`}
                >
                  <span className="text-muted-foreground">{log.time}</span>{" "}
                  <span className={`font-medium ${agentTextColors[log.agent]}`}>
                    [{log.agent}]
                  </span>{" "}
                  {log.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
