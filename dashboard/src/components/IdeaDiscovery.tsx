"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Check,
} from "lucide-react";

interface DiscoveredIdea {
  id: string;
  title: string;
  source: string;
  score: number;
  url: string;
  snippet: string;
}

interface DiscoveryResult {
  ideas: DiscoveredIdea[];
  total: number;
  sources: string[];
  discoveredAt: string;
  fromCache?: boolean;
}

export function IdeaDiscovery({ onIdeaAdded }: { onIdeaAdded?: () => void }) {
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);

  const discover = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/discover");
      if (!response.ok) throw new Error("Discovery failed");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError("Failed to discover ideas. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const addToPipeline = async (idea: DiscoveredIdea) => {
    setAddingId(idea.id);

    try {
      const response = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: idea.title,
          snippet: idea.snippet,
          source: idea.source,
          score: idea.score,
        }),
      });

      if (response.ok) {
        setAddedIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(idea.id);
          return newSet;
        });
        onIdeaAdded?.();
      }
    } catch {
      // Silently fail
    } finally {
      setAddingId(null);
    }
  };

  useEffect(() => {
    // Auto-discover on mount
    discover();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Live Idea Discovery
            <Badge variant="outline" className="text-xs font-normal">
              No API needed
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={discover}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Scanning..." : "Refresh"}
          </Button>
        </div>
        {result && (
          <p className="text-sm text-muted-foreground">
            Found {result.total} potential ideas from {result.sources.join(", ")}
            {result.fromCache && " (cached)"}
          </p>
        )}
      </CardHeader>

      <CardContent>
        {loading && !result && (
          <div className="text-center py-8">
            <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">
              Scanning Reddit for pain points...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={discover} className="mt-2">
              Try Again
            </Button>
          </div>
        )}

        {result && result.ideas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No high-potential ideas found right now.</p>
            <p className="text-sm">Check back in a few minutes.</p>
          </div>
        )}

        {result && result.ideas.length > 0 && (
          <div className="space-y-3">
            {result.ideas.slice(0, 5).map((idea) => (
              <div
                key={idea.id}
                className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {idea.source}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3" />
                        <span>Score: {idea.score}</span>
                      </div>
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2">{idea.title}</h4>
                    {idea.snippet && idea.snippet !== idea.title && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {idea.snippet}
                      </p>
                    )}
                    <div className="mt-2">
                      <Progress value={idea.score} className="h-1" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    {addedIds.has(idea.id) ? (
                      <Button size="sm" variant="ghost" disabled className="gap-1">
                        <Check className="w-4 h-4 text-green-500" />
                        Added
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToPipeline(idea)}
                        disabled={addingId === idea.id}
                        className="gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(idea.url, "_blank")}
                      className="gap-1 text-xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {result.ideas.length > 5 && (
              <p className="text-center text-sm text-muted-foreground">
                + {result.ideas.length - 5} more ideas found
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
