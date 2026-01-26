"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { AlertTriangle, AlertCircle, Lightbulb, TrendingDown } from "lucide-react";

interface CostData {
  total: number;
  tokens?: number;
  count?: number;
}

interface Budget {
  monthly: number;
  alerts: {
    warning: number;
    critical: number;
  };
}

interface CostCenterProps {
  costs: Record<string, CostData>;
  budget: Budget;
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function CostCenter({ costs, budget }: CostCenterProps) {
  const totalSpent = Object.values(costs).reduce((sum, c) => sum + c.total, 0);
  const budgetUsed = (totalSpent / budget.monthly) * 100;
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();
  const daysRemaining = daysInMonth - new Date().getDate();

  const pieData = Object.entries(costs).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " "),
    value: data.total,
  }));

  // Calculate optimization suggestions
  const suggestions: { text: string; impact: string }[] = [];
  if (costs.claude && costs.claude.total > budget.monthly * 0.3) {
    suggestions.push({
      text: "Consider using Haiku for simple tasks (60% cheaper)",
      impact: "Could save ~$" + (costs.claude.total * 0.4).toFixed(2) + "/mo",
    });
  }
  if (costs.gemini_image && costs.gemini_image.count && costs.gemini_image.count > 100) {
    suggestions.push({
      text: "Use batch API for images (50% savings)",
      impact: "Could save ~$" + (costs.gemini_image.total * 0.5).toFixed(2) + "/mo",
    });
  }
  if (costs.captcha && costs.captcha.total > 5) {
    suggestions.push({
      text: "Improve stealth settings to reduce CAPTCHA encounters",
      impact: "Could save ~$" + (costs.captcha.total * 0.6).toFixed(2) + "/mo",
    });
  }

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold">${totalSpent.toFixed(2)}</span>
            <span className="text-muted-foreground">of ${budget.monthly}</span>
          </div>
          <Progress
            value={budgetUsed}
            className={
              budgetUsed > 90
                ? "[&>div]:bg-red-500"
                : budgetUsed > 75
                ? "[&>div]:bg-yellow-500"
                : ""
            }
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{budgetUsed.toFixed(1)}% used</span>
            <span>{daysRemaining} days remaining</span>
          </div>
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">Projected: </span>
            <span
              className={
                (totalSpent / (daysInMonth - daysRemaining)) * daysInMonth >
                budget.monthly
                  ? "text-red-500"
                  : "text-green-500"
              }
            >
              $
              {(
                (totalSpent / Math.max(daysInMonth - daysRemaining, 1)) *
                daysInMonth
              ).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost by Service</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Cost"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(costs).map(([name, data], i) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="font-medium capitalize">
                      {name.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${data.total.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {data.count
                        ? `${data.count.toLocaleString()} calls`
                        : data.tokens
                        ? `${data.tokens.toLocaleString()} tokens`
                        : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Alerts */}
      {budgetUsed > 75 && (
        <Card
          className={
            budgetUsed > 90 ? "border-red-500/50" : "border-yellow-500/50"
          }
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {budgetUsed > 90 ? (
                <AlertCircle className="w-8 h-8 text-red-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              )}
              <div>
                <div className="font-medium">
                  {budgetUsed > 90 ? "Budget Critical!" : "Budget Warning"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {budgetUsed > 90
                    ? "Consider pausing non-essential operations"
                    : "Approaching monthly budget limit"}
                </div>
              </div>
              <Badge
                variant={budgetUsed > 90 ? "destructive" : "warning"}
                className="ml-auto"
              >
                {budgetUsed.toFixed(0)}% used
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Optimization Tips */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Optimization Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {suggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-3">
                  <TrendingDown className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm">{suggestion.text}</div>
                    <div className="text-xs text-green-500">{suggestion.impact}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
