"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Users, DollarSign, RefreshCcw, Target } from "lucide-react";

interface RevenueDataPoint {
  date: string;
  mrr: number;
}

interface UserDataPoint {
  date: string;
  users: number;
  active: number;
}

interface App {
  id: string;
  name: string;
  mrr: number;
  customers: number;
  arpu: number;
  churnRate: number;
  trialConversion: number;
  revenueHistory: RevenueDataPoint[];
  userHistory: UserDataPoint[];
  posthogProjectId?: string | null;
}

interface AppPerformanceProps {
  apps: App[];
}

export function AppPerformance({ apps }: AppPerformanceProps) {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(
    apps[0]?.id || null
  );

  const selectedApp = apps.find((a) => a.id === selectedAppId);

  if (apps.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-semibold mb-2">No Apps Deployed Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your first app to see performance metrics here.
            </p>
            <Button>Build New App</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* App Selector */}
      <div className="flex gap-2 flex-wrap">
        {apps.map((a) => (
          <Button
            key={a.id}
            onClick={() => setSelectedAppId(a.id)}
            variant={selectedAppId === a.id ? "default" : "outline"}
            className="gap-2"
          >
            {a.name}
            <span className="text-xs opacity-70">${a.mrr}/mo</span>
          </Button>
        ))}
      </div>

      {selectedApp && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">MRR</span>
                </div>
                <div className="text-3xl font-bold text-green-500">
                  ${selectedApp.mrr.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Customers</span>
                </div>
                <div className="text-3xl font-bold">{selectedApp.customers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">ARPU</span>
                </div>
                <div className="text-3xl font-bold">${selectedApp.arpu}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCcw className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Churn Rate</span>
                </div>
                <div className={`text-3xl font-bold ${selectedApp.churnRate > 5 ? "text-red-500" : "text-green-500"}`}>
                  {selectedApp.churnRate}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm text-muted-foreground">Trial to Paid</span>
                </div>
                <div className="text-3xl font-bold">{selectedApp.trialConversion}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedApp.revenueHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`$${value}`, "MRR"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="mrr"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedApp.userHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Total Users"
                    />
                    <Line
                      type="monotone"
                      dataKey="active"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Embed Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Replays & Heatmaps</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedApp.posthogProjectId ? (
                <iframe
                  src={`https://app.posthog.com/embedded/${selectedApp.posthogProjectId}?tab=replays`}
                  className="w-full h-[500px] rounded-lg border"
                  title="PostHog Analytics"
                />
              ) : (
                <div className="w-full h-[200px] rounded-lg border border-dashed flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p className="mb-2">PostHog integration not configured</p>
                    <Button variant="outline" size="sm">
                      Connect PostHog
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
