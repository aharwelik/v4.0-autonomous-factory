# 📊 Factory Dashboard
## Real-time Monitoring & Control Center

**Purpose**: Single view into all factory operations

---

## DASHBOARD OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏭 APP FACTORY DASHBOARD                                    [Settings] │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ │
│  │ Pipeline  │ │  Agents   │ │   Apps    │ │  Content  │ │   Costs   │ │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                        [Tab Content Here]                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## TAB 1: PIPELINE HEALTH

Shows the flow of ideas through validation to launched apps.

```jsx
// components/PipelineHealth.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function PipelineHealth({ data }) {
  const stages = [
    { name: "Ideas Discovered", count: data.ideas, icon: "💡" },
    { name: "In Validation", count: data.validating, icon: "🔍" },
    { name: "Building", count: data.building, icon: "🔨" },
    { name: "Deployed", count: data.deployed, icon: "🚀" },
    { name: "Revenue", count: data.revenue, icon: "💰" }
  ];
  
  return (
    <div className="space-y-6">
      {/* Funnel visualization */}
      <div className="flex items-center justify-between gap-4">
        {stages.map((stage, i) => (
          <div key={stage.name} className="flex-1 text-center">
            <div className="text-4xl mb-2">{stage.icon}</div>
            <div className="text-2xl font-bold">{stage.count}</div>
            <div className="text-sm text-muted-foreground">{stage.name}</div>
            {i < stages.length - 1 && (
              <div className="absolute right-0 top-1/2 text-muted-foreground">→</div>
            )}
          </div>
        ))}
      </div>
      
      {/* Recent discoveries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Opportunities (Score ≥70)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentOpportunities.map(opp => (
              <div key={opp.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <div className="font-medium">{opp.title}</div>
                  <div className="text-sm text-muted-foreground">{opp.source}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-lg font-bold ${opp.score >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {opp.score}/100
                  </div>
                  <button className="btn btn-primary btn-sm">Validate</button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Weekly stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{data.weeklyIdeas}</div>
            <div className="text-sm text-muted-foreground">Ideas This Week</div>
            <div className="text-xs text-green-500">+{data.ideaGrowth}% vs last week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{data.highScoreIdeas}</div>
            <div className="text-sm text-muted-foreground">High Score (≥70)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{data.falsePositiveRate}%</div>
            <div className="text-sm text-muted-foreground">False Positive Rate</div>
            <div className="text-xs text-muted-foreground">Target: &lt;30%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">${data.pipelineValue}</div>
            <div className="text-sm text-muted-foreground">Pipeline Value</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## TAB 2: AGENT ACTIVITY

Real-time view of what agents are doing.

```jsx
// components/AgentActivity.jsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AgentActivity() {
  const [agents, setAgents] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Real-time updates via WebSocket
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/agents');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'agent_status') {
        setAgents(data.agents);
      } else if (data.type === 'agent_log') {
        setLogs(prev => [data.log, ...prev].slice(0, 100));
      }
    };
    
    return () => ws.close();
  }, []);
  
  const agentColors = {
    orchestrator: 'bg-purple-500',
    researcher: 'bg-blue-500',
    builder: 'bg-green-500',
    marketer: 'bg-orange-500',
    operator: 'bg-red-500'
  };
  
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Agent Status Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active Agents</h3>
        {agents.map(agent => (
          <Card key={agent.name}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${agentColors[agent.name]} ${agent.status === 'working' ? 'animate-pulse' : ''}`} />
                  <div>
                    <div className="font-medium capitalize">{agent.name}</div>
                    <div className="text-sm text-muted-foreground">{agent.currentTask || 'Idle'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={agent.status === 'working' ? 'default' : 'secondary'}>
                    {agent.status}
                  </Badge>
                  {agent.progress > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {agent.progress}%
                    </div>
                  )}
                </div>
              </div>
              
              {/* Subagents */}
              {agent.subagents?.length > 0 && (
                <div className="mt-3 pl-6 space-y-2">
                  {agent.subagents.map(sub => (
                    <div key={sub.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{sub.name}</span>
                      <span className={sub.status === 'running' ? 'text-green-500' : 'text-muted-foreground'}>
                        {sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Cost for this agent today */}
              <div className="mt-3 text-xs text-muted-foreground">
                Today's cost: ${agent.costToday.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Activity Log */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Live Activity</h3>
        <Card className="h-[600px] overflow-hidden">
          <CardContent className="p-0">
            <div className="h-full overflow-y-auto p-4 font-mono text-sm">
              {logs.map((log, i) => (
                <div key={i} className={`py-1 ${log.level === 'error' ? 'text-red-500' : ''}`}>
                  <span className="text-muted-foreground">{log.time}</span>
                  {' '}
                  <span className={`font-medium ${agentColors[log.agent]?.replace('bg-', 'text-')}`}>
                    [{log.agent}]
                  </span>
                  {' '}
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
```

---

## TAB 3: APP PERFORMANCE

Per-app analytics with PostHog integration.

```jsx
// components/AppPerformance.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function AppPerformance({ apps }) {
  const [selectedApp, setSelectedApp] = useState(apps[0]?.id);
  const app = apps.find(a => a.id === selectedApp);
  
  return (
    <div className="space-y-6">
      {/* App Selector */}
      <div className="flex gap-2 flex-wrap">
        {apps.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedApp(a.id)}
            className={`px-4 py-2 rounded-lg ${
              selectedApp === a.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}
          >
            {a.name}
            <span className="ml-2 text-xs opacity-70">
              ${a.mrr}/mo
            </span>
          </button>
        ))}
      </div>
      
      {app && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-500">${app.mrr}</div>
                <div className="text-sm text-muted-foreground">MRR</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{app.customers}</div>
                <div className="text-sm text-muted-foreground">Customers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">${app.arpu}</div>
                <div className="text-sm text-muted-foreground">ARPU</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{app.churnRate}%</div>
                <div className="text-sm text-muted-foreground">Churn Rate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{app.trialConversion}%</div>
                <div className="text-sm text-muted-foreground">Trial→Paid</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={app.revenueHistory}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="mrr" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={app.userHistory}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="active" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* PostHog Embed */}
          <Card>
            <CardHeader>
              <CardTitle>Session Replays & Heatmaps</CardTitle>
            </CardHeader>
            <CardContent>
              <iframe
                src={`https://app.posthog.com/embedded/${app.posthogProjectId}?tab=replays`}
                className="w-full h-[500px] rounded-lg border"
                title="PostHog Analytics"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
```

---

## TAB 4: CONTENT CALENDAR

Scheduled and generated content queue.

```jsx
// components/ContentCalendar.jsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ContentCalendar({ content }) {
  const [filter, setFilter] = useState('all');
  
  const platforms = {
    twitter: { icon: '𝕏', color: 'bg-black' },
    linkedin: { icon: 'in', color: 'bg-blue-700' },
    producthunt: { icon: '🔺', color: 'bg-orange-500' },
    blog: { icon: '📝', color: 'bg-gray-500' }
  };
  
  const filteredContent = filter === 'all' 
    ? content 
    : content.filter(c => c.platform === filter);
  
  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          All
        </button>
        {Object.entries(platforms).map(([key, val]) => (
          <button 
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg ${filter === key ? val.color + ' text-white' : 'bg-muted'}`}
          >
            {val.icon} {key}
          </button>
        ))}
      </div>
      
      {/* Content Queue */}
      <div className="grid grid-cols-3 gap-4">
        {/* Scheduled */}
        <Card>
          <CardHeader>
            <CardTitle>📅 Scheduled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredContent.filter(c => c.status === 'scheduled').map(item => (
              <ContentCard key={item.id} item={item} platforms={platforms} />
            ))}
          </CardContent>
        </Card>
        
        {/* Ready to Post */}
        <Card>
          <CardHeader>
            <CardTitle>✅ Ready to Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredContent.filter(c => c.status === 'ready').map(item => (
              <ContentCard key={item.id} item={item} platforms={platforms} />
            ))}
          </CardContent>
        </Card>
        
        {/* Posted */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Posted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredContent.filter(c => c.status === 'posted').map(item => (
              <ContentCard key={item.id} item={item} platforms={platforms} showEngagement />
            ))}
          </CardContent>
        </Card>
      </div>
      
      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button className="btn btn-primary">
              🐦 Generate Twitter Thread
            </button>
            <button className="btn btn-secondary">
              💼 Generate LinkedIn Post
            </button>
            <button className="btn btn-secondary">
              📝 Generate Blog Post
            </button>
            <button className="btn btn-secondary">
              🖼️ Generate Images
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContentCard({ item, platforms, showEngagement }) {
  return (
    <div className="p-3 bg-muted rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <Badge className={platforms[item.platform].color}>
          {platforms[item.platform].icon} {item.platform}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {new Date(item.scheduledFor).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm line-clamp-3">{item.content}</p>
      {item.image && (
        <img src={item.image} alt="" className="mt-2 rounded w-full h-24 object-cover" />
      )}
      {showEngagement && item.engagement && (
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span>❤️ {item.engagement.likes}</span>
          <span>🔄 {item.engagement.shares}</span>
          <span>💬 {item.engagement.comments}</span>
        </div>
      )}
    </div>
  );
}
```

---

## TAB 5: COST CENTER

Budget tracking and API usage.

```jsx
// components/CostCenter.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export function CostCenter({ costs, budget }) {
  const totalSpent = Object.values(costs).reduce((sum, c) => sum + c.total, 0);
  const budgetUsed = (totalSpent / budget.monthly) * 100;
  
  const pieData = Object.entries(costs).map(([name, data]) => ({
    name,
    value: data.total
  }));
  
  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  
  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">${totalSpent.toFixed(2)}</span>
            <span className="text-muted-foreground">of ${budget.monthly}</span>
          </div>
          <Progress 
            value={budgetUsed} 
            className={budgetUsed > 90 ? 'bg-red-200' : budgetUsed > 75 ? 'bg-yellow-200' : ''}
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{budgetUsed.toFixed(1)}% used</span>
            <span>{30 - new Date().getDate()} days remaining</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Cost Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost by Service</CardTitle>
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(costs).map(([name, data], i) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[i] }}
                    />
                    <span className="font-medium capitalize">{name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${data.total.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {data.count || data.tokens?.toLocaleString()} {data.count ? 'calls' : 'tokens'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Alerts */}
      {budgetUsed > 75 && (
        <Card className={budgetUsed > 90 ? 'border-red-500' : 'border-yellow-500'}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{budgetUsed > 90 ? '🚨' : '⚠️'}</span>
              <div>
                <div className="font-medium">
                  {budgetUsed > 90 ? 'Budget Critical!' : 'Budget Warning'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {budgetUsed > 90 
                    ? 'Consider pausing non-essential operations'
                    : 'Approaching monthly budget limit'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Cost Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Optimization Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {costs.claude?.total > budget.monthly * 0.3 && (
              <li className="flex items-center gap-2">
                <span className="text-yellow-500">•</span>
                Consider using Haiku for simple tasks (60% cheaper)
              </li>
            )}
            {costs.gemini_image?.count > 100 && (
              <li className="flex items-center gap-2">
                <span className="text-yellow-500">•</span>
                Use batch API for images (50% savings)
              </li>
            )}
            {costs.captcha?.total > 5 && (
              <li className="flex items-center gap-2">
                <span className="text-yellow-500">•</span>
                Improve stealth settings to reduce CAPTCHA encounters
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## MAIN DASHBOARD COMPONENT

```jsx
// components/Dashboard.jsx
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PipelineHealth } from "./PipelineHealth";
import { AgentActivity } from "./AgentActivity";
import { AppPerformance } from "./AppPerformance";
import { ContentCalendar } from "./ContentCalendar";
import { CostCenter } from "./CostCenter";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardData().then(d => {
      setData(d);
      setLoading(false);
    });
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin text-4xl">🏭</div>
    </div>;
  }
  
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">🏭 App Factory Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <button className="btn btn-outline btn-sm">⚙️ Settings</button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="pipeline">
        <TabsList className="mb-6">
          <TabsTrigger value="pipeline">📊 Pipeline</TabsTrigger>
          <TabsTrigger value="agents">🤖 Agents</TabsTrigger>
          <TabsTrigger value="apps">📱 Apps</TabsTrigger>
          <TabsTrigger value="content">📝 Content</TabsTrigger>
          <TabsTrigger value="costs">💰 Costs</TabsTrigger>
        </TabsList>
        
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
      </Tabs>
    </div>
  );
}

async function fetchDashboardData() {
  const response = await fetch('/api/dashboard');
  return response.json();
}
```

---

## API ENDPOINT

```typescript
// app/api/dashboard/route.ts
import { db } from "@/db";

export async function GET() {
  // Aggregate data from all sources
  const [
    pipeline,
    apps,
    content,
    costs
  ] = await Promise.all([
    getPipelineData(),
    getAppsData(),
    getContentData(),
    getCostsData()
  ]);
  
  return Response.json({
    pipeline,
    apps,
    content,
    costs,
    budget: {
      monthly: 50,  // $50/month default budget
      alerts: { warning: 75, critical: 90 }
    }
  });
}

async function getPipelineData() {
  // Query Airtable or database for opportunity pipeline
  return {
    ideas: 47,
    validating: 5,
    building: 2,
    deployed: 3,
    revenue: 1,
    recentOpportunities: [],
    weeklyIdeas: 23,
    ideaGrowth: 15,
    highScoreIdeas: 4,
    falsePositiveRate: 25,
    pipelineValue: 15000
  };
}

async function getAppsData() {
  // Query PostHog and Stripe for app metrics
  return [];
}

async function getContentData() {
  // Query content queue
  return [];
}

async function getCostsData() {
  // Aggregate API usage costs
  return {
    claude: { total: 8.50, tokens: 2500000 },
    gemini: { total: 3.20, count: 80 },
    grok: { total: 1.50, tokens: 500000 },
    captcha: { total: 0.80, count: 400 }
  };
}
```

---

*Dashboard v4.0 - Complete monitoring interface*
