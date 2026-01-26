"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Workflow,
  Download,
  ExternalLink,
  Copy,
  Check,
  Play,
  Settings,
  Zap,
  Clock,
  MessageSquare,
} from "lucide-react";

interface N8nWorkflow {
  id: string;
  name: string;
  description: string;
  filename: string;
  triggers: string[];
  actions: string[];
}

const WORKFLOWS: N8nWorkflow[] = [
  {
    id: "content-generation",
    name: "Content Generation",
    description: "Auto-generates and schedules social media content for your apps",
    filename: "content-generation.json",
    triggers: ["Daily at 8 AM (weekdays)"],
    actions: ["Fetch scheduled content", "Generate with AI", "Post to Twitter/LinkedIn"],
  },
  {
    id: "opportunity-discovery",
    name: "Opportunity Discovery",
    description: "Scans Reddit, Twitter, and forums for app ideas and pain points",
    filename: "opportunity-discovery.json",
    triggers: ["Every 4 hours"],
    actions: ["Scrape Reddit", "Score opportunities", "Save to pipeline", "Send alerts"],
  },
];

export function WorkflowManager() {
  const [n8nUrl, setN8nUrl] = useState("");
  const [n8nApiKey, setN8nApiKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  // Load saved n8n config
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.n8n_url) setN8nUrl(data.n8n_url);
          if (data.n8n_api_key) setN8nApiKey(data.n8n_api_key);
        }
      } catch {
        // Use defaults
      }
    };
    loadConfig();
  }, []);

  const saveConfig = async () => {
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          n8n_url: n8nUrl,
          n8n_api_key: n8nApiKey,
        }),
      });
    } catch {
      // Silently fail
    }
  };

  const testConnection = async () => {
    if (!n8nUrl) return;

    try {
      // n8n health check endpoint
      const response = await fetch(`${n8nUrl}/healthz`, {
        headers: n8nApiKey ? { "X-N8N-API-KEY": n8nApiKey } : {},
      });
      setConnected(response.ok);
      if (response.ok) {
        saveConfig();
      }
    } catch {
      setConnected(false);
    }
  };

  const downloadWorkflow = async (workflow: N8nWorkflow) => {
    setDownloading(workflow.id);
    try {
      const response = await fetch(`/api/workflows/${workflow.filename}`);
      const data = await response.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = workflow.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open GitHub raw file
      window.open(
        `https://raw.githubusercontent.com/aharwelik/v4.0-autonomous-factory/main/workflows/n8n-templates/${workflow.filename}`,
        "_blank"
      );
    } finally {
      setDownloading(null);
    }
  };

  const copyImportUrl = (workflow: N8nWorkflow) => {
    const url = `https://raw.githubusercontent.com/aharwelik/v4.0-autonomous-factory/main/workflows/n8n-templates/${workflow.filename}`;
    navigator.clipboard.writeText(url);
    setCopied(workflow.id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-orange-500" />
            n8n Workflows
          </CardTitle>
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Automation workflows for content generation and opportunity discovery
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* n8n Setup Instructions */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <p className="font-medium mb-2">Setup n8n (free, self-hosted):</p>
          <ol className="list-decimal ml-4 space-y-1 text-muted-foreground">
            <li>
              Install n8n:{" "}
              <code className="bg-background px-1 rounded">npx n8n</code> or{" "}
              <Button
                variant="link"
                className="h-auto p-0 text-blue-500"
                onClick={() => window.open("https://n8n.io/cloud", "_blank")}
              >
                n8n Cloud <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </li>
            <li>Import workflows below (download or copy URL)</li>
            <li>Configure credentials (API keys) in n8n</li>
            <li>Activate workflows</li>
          </ol>
        </div>

        {/* n8n Connection (Optional) */}
        <div className="border rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Connect to n8n (optional)</span>
          </div>
          <div className="grid gap-2">
            <div className="space-y-1">
              <Label htmlFor="n8nUrl" className="text-xs">n8n URL</Label>
              <Input
                id="n8nUrl"
                placeholder="http://localhost:5678"
                value={n8nUrl}
                onChange={(e) => setN8nUrl(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="n8nApiKey" className="text-xs">API Key (optional)</Label>
              <Input
                id="n8nApiKey"
                type="password"
                placeholder="n8n API key"
                value={n8nApiKey}
                onChange={(e) => setN8nApiKey(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={testConnection} className="gap-2">
            <Zap className="w-3 h-3" />
            Test Connection
          </Button>
        </div>

        {/* Available Workflows */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Available Workflows:</p>

          {WORKFLOWS.map((workflow) => (
            <div key={workflow.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm">{workflow.name}</h4>
                  <p className="text-xs text-muted-foreground">{workflow.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadWorkflow(workflow)}
                    disabled={downloading === workflow.id}
                    className="h-7 px-2"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyImportUrl(workflow)}
                    className="h-7 px-2"
                  >
                    {copied === workflow.id ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {workflow.triggers.join(", ")}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {workflow.actions.map((action, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Start */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Quick Start</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>1. Run: <code className="bg-background px-1 rounded">npx n8n</code></p>
            <p>2. Open: <code className="bg-background px-1 rounded">http://localhost:5678</code></p>
            <p>3. Import → From URL → Paste workflow URL</p>
            <p>4. Add your API keys in Credentials</p>
            <p>5. Toggle workflow ON</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
