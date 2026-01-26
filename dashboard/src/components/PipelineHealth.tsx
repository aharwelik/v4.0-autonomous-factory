"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  Search,
  Hammer,
  Rocket,
  DollarSign,
  ArrowRight,
  TrendingUp
} from "lucide-react";

interface Opportunity {
  id: string;
  title: string;
  source: string;
  score: number;
  discoveredAt: string;
}

interface PipelineData {
  ideas: number;
  validating: number;
  building: number;
  deployed: number;
  revenue: number;
  recentOpportunities: Opportunity[];
  weeklyIdeas: number;
  ideaGrowth: number;
  highScoreIdeas: number;
  falsePositiveRate: number;
  pipelineValue: number;
}

interface PipelineHealthProps {
  data: PipelineData;
}

export function PipelineHealth({ data }: PipelineHealthProps) {
  const stages = [
    { name: "Ideas Discovered", count: data.ideas, icon: Lightbulb, color: "text-yellow-500" },
    { name: "In Validation", count: data.validating, icon: Search, color: "text-blue-500" },
    { name: "Building", count: data.building, icon: Hammer, color: "text-orange-500" },
    { name: "Deployed", count: data.deployed, icon: Rocket, color: "text-purple-500" },
    { name: "Revenue", count: data.revenue, icon: DollarSign, color: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Opportunity Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            {stages.map((stage, i) => (
              <div key={stage.name} className="flex items-center flex-1">
                <div className="flex-1 text-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <stage.icon className={`w-8 h-8 mx-auto mb-2 ${stage.color}`} />
                  <div className="text-3xl font-bold">{stage.count}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stage.name}</div>
                </div>
                {i < stages.length - 1 && (
                  <ArrowRight className="w-5 h-5 mx-2 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Opportunities (Score 70+)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentOpportunities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No high-scoring opportunities yet. The researcher agent is scanning...
              </div>
            ) : (
              data.recentOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{opp.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <span>{opp.source}</span>
                      <span className="text-xs">-</span>
                      <span className="text-xs">{opp.discoveredAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={opp.score >= 80 ? "success" : "warning"}
                      className="text-sm"
                    >
                      {opp.score}/100
                    </Badge>
                    <Button size="sm">Validate</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{data.weeklyIdeas}</div>
            <div className="text-sm text-muted-foreground">Ideas This Week</div>
            <div className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +{data.ideaGrowth}% vs last week
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{data.highScoreIdeas}</div>
            <div className="text-sm text-muted-foreground">High Score (70+)</div>
            <div className="text-xs text-muted-foreground mt-1">Ready to validate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{data.falsePositiveRate}%</div>
            <div className="text-sm text-muted-foreground">False Positive Rate</div>
            <div className="text-xs text-muted-foreground mt-1">Target: &lt;30%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-500">
              ${data.pipelineValue.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Pipeline Value</div>
            <div className="text-xs text-muted-foreground mt-1">Projected ARR</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
