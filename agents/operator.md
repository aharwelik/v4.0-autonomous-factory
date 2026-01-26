# 📈 Operator Agent
## Revenue Monitoring & Operations

**Role**: Monitor app health, track revenue, generate reports, and alert on anomalies

---

## CORE RESPONSIBILITIES

1. **Revenue Tracking**: Monitor Stripe, track MRR, ARR, churn
2. **Health Monitoring**: Uptime, errors, performance
3. **Alerting**: Real-time notifications via Telegram
4. **Reporting**: Daily/weekly/monthly reports
5. **Anomaly Detection**: Catch issues before users complain

---

## DATA SOURCES

### Revenue (Stripe)

```yaml
stripe_metrics:
  real_time:
    - new_subscriptions
    - cancellations
    - failed_payments
    - refunds

  aggregated:
    - mrr: "Monthly Recurring Revenue"
    - arr: "Annual Recurring Revenue"
    - arpu: "Average Revenue Per User"
    - ltv: "Lifetime Value"
    - cac: "Customer Acquisition Cost"
    - churn_rate: "Monthly churn %"
    - net_revenue_retention: "NRR %"
```

### Analytics (PostHog)

```yaml
posthog_metrics:
  engagement:
    - daily_active_users
    - weekly_active_users
    - monthly_active_users
    - session_duration
    - pages_per_session

  conversion:
    - signup_rate
    - activation_rate
    - trial_to_paid_rate
    - feature_adoption

  retention:
    - day_1_retention
    - day_7_retention
    - day_30_retention
```

### Infrastructure (Vercel/Railway)

```yaml
infrastructure_metrics:
  uptime:
    - availability_percentage
    - downtime_minutes

  performance:
    - p50_response_time
    - p95_response_time
    - p99_response_time
    - error_rate

  resources:
    - bandwidth_used
    - function_invocations
    - database_connections
```

---

## MONITORING SCRIPTS

### Stripe Revenue Monitor

```javascript
// monitors/stripe-revenue.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class RevenueMonitor {
  async getCurrentMRR() {
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      expand: ['data.items.data.price']
    });

    let mrr = 0;

    for (const sub of subscriptions.data) {
      for (const item of sub.items.data) {
        const price = item.price;

        if (price.recurring.interval === 'month') {
          mrr += price.unit_amount / 100;
        } else if (price.recurring.interval === 'year') {
          mrr += (price.unit_amount / 100) / 12;
        }
      }
    }

    return mrr;
  }

  async getRevenueMetrics() {
    const [mrr, customers, recentPayments] = await Promise.all([
      this.getCurrentMRR(),
      stripe.customers.list({ limit: 1 }),
      stripe.paymentIntents.list({
        limit: 100,
        created: { gte: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60 }
      })
    ]);

    const successfulPayments = recentPayments.data.filter(p => p.status === 'succeeded');
    const failedPayments = recentPayments.data.filter(p => p.status === 'canceled' || p.status === 'requires_payment_method');

    return {
      mrr,
      arr: mrr * 12,
      totalCustomers: customers.data.length,
      last30Days: {
        revenue: successfulPayments.reduce((sum, p) => sum + p.amount, 0) / 100,
        payments: successfulPayments.length,
        failed: failedPayments.length,
        failureRate: failedPayments.length / recentPayments.data.length * 100
      }
    };
  }

  async getChurnRate() {
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

    const [canceledSubs, activeSubs] = await Promise.all([
      stripe.subscriptions.list({
        status: 'canceled',
        created: { gte: thirtyDaysAgo }
      }),
      stripe.subscriptions.list({ status: 'active' })
    ]);

    const totalAtRisk = activeSubs.data.length + canceledSubs.data.length;
    const churnRate = (canceledSubs.data.length / totalAtRisk) * 100;

    return {
      churned: canceledSubs.data.length,
      active: activeSubs.data.length,
      churnRate: churnRate.toFixed(2)
    };
  }
}

export const revenueMonitor = new RevenueMonitor();
```

### PostHog Analytics Monitor

```javascript
// monitors/posthog-analytics.js
import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.POSTHOG_API_KEY, {
  host: process.env.POSTHOG_HOST || 'https://app.posthog.com'
});

class AnalyticsMonitor {
  constructor(projectId) {
    this.projectId = projectId;
    this.apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  }

  async query(query) {
    const response = await fetch(`https://app.posthog.com/api/projects/${this.projectId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    return await response.json();
  }

  async getDailyActiveUsers(days = 7) {
    const results = await this.query({
      kind: 'TrendsQuery',
      series: [{
        kind: 'EventsNode',
        event: '$pageview',
        math: 'dau'
      }],
      dateRange: { date_from: `-${days}d` }
    });

    return results.results[0]?.data || [];
  }

  async getConversionFunnel() {
    const results = await this.query({
      kind: 'FunnelsQuery',
      series: [
        { kind: 'EventsNode', event: 'page_view', name: 'Visit' },
        { kind: 'EventsNode', event: 'signup_started', name: 'Start Signup' },
        { kind: 'EventsNode', event: 'signup_completed', name: 'Complete Signup' },
        { kind: 'EventsNode', event: 'subscription_started', name: 'Subscribe' }
      ],
      dateRange: { date_from: '-30d' }
    });

    return results.results;
  }

  async getRetention() {
    const results = await this.query({
      kind: 'RetentionQuery',
      retentionFilter: {
        retentionType: 'retention_first_time',
        totalIntervals: 7,
        period: 'Day'
      },
      dateRange: { date_from: '-30d' }
    });

    return results.results;
  }
}

export const analyticsMonitor = new AnalyticsMonitor(process.env.POSTHOG_PROJECT_ID);
```

### Infrastructure Monitor

```javascript
// monitors/infrastructure.js
class InfrastructureMonitor {
  async checkVercelDeployment(projectId) {
    const response = await fetch(`https://api.vercel.com/v9/projects/${projectId}/deployments?limit=1`, {
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`
      }
    });

    const data = await response.json();
    const latest = data.deployments[0];

    return {
      status: latest.readyState,
      url: latest.url,
      createdAt: latest.createdAt,
      isHealthy: latest.readyState === 'READY'
    };
  }

  async checkEndpointHealth(url) {
    const start = Date.now();

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 10000
      });

      const responseTime = Date.now() - start;

      return {
        healthy: response.ok,
        statusCode: response.status,
        responseTime,
        url
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        responseTime: Date.now() - start,
        url
      };
    }
  }

  async runHealthChecks(endpoints) {
    const results = await Promise.all(
      endpoints.map(url => this.checkEndpointHealth(url))
    );

    const healthyCount = results.filter(r => r.healthy).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    return {
      endpoints: results,
      summary: {
        healthy: healthyCount,
        total: results.length,
        uptime: (healthyCount / results.length * 100).toFixed(2),
        avgResponseTime: Math.round(avgResponseTime)
      }
    };
  }
}

export const infrastructureMonitor = new InfrastructureMonitor();
```

---

## ALERTING SYSTEM

### Telegram Alerting

```javascript
// alerts/telegram.js
class TelegramAlerter {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async send(message, options = {}) {
    const response = await fetch(`${this.apiUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: this.chatId,
        text: message,
        parse_mode: 'HTML',
        disable_notification: options.silent || false
      })
    });

    return await response.json();
  }

  // Alert templates
  async alertRevenue(data) {
    const emoji = data.change > 0 ? '📈' : '📉';
    const message = `
${emoji} <b>Revenue Update</b>

MRR: $${data.mrr.toFixed(2)}
Change: ${data.change > 0 ? '+' : ''}${data.change.toFixed(2)}%
New customers: ${data.newCustomers}
Churned: ${data.churned}

<i>Updated: ${new Date().toLocaleString()}</i>
    `.trim();

    return this.send(message);
  }

  async alertDowntime(data) {
    const message = `
🚨 <b>DOWNTIME ALERT</b>

App: ${data.appName}
URL: ${data.url}
Status: ${data.statusCode || 'Unreachable'}
Error: ${data.error || 'N/A'}

<b>Action Required!</b>
    `.trim();

    return this.send(message);
  }

  async alertPaymentFailed(data) {
    const message = `
💳 <b>Payment Failed</b>

Customer: ${data.customerEmail}
Amount: $${data.amount}
Reason: ${data.failureReason}

Auto-retry scheduled.
    `.trim();

    return this.send(message);
  }

  async alertAnomalyDetected(data) {
    const message = `
⚠️ <b>Anomaly Detected</b>

Metric: ${data.metric}
Expected: ${data.expected}
Actual: ${data.actual}
Deviation: ${data.deviation}%

${data.recommendation}
    `.trim();

    return this.send(message);
  }

  async alertDailyReport(data) {
    const message = `
📊 <b>Daily Report - ${data.date}</b>

<b>Revenue</b>
MRR: $${data.mrr.toFixed(2)}
Today's revenue: $${data.todayRevenue.toFixed(2)}
New subscriptions: ${data.newSubs}

<b>Usage</b>
DAU: ${data.dau}
Sessions: ${data.sessions}
Avg duration: ${data.avgDuration}min

<b>Health</b>
Uptime: ${data.uptime}%
Avg response: ${data.avgResponse}ms
Errors: ${data.errors}

<b>Costs</b>
Today: $${data.costs.toFixed(2)}
MTD: $${data.costsMTD.toFixed(2)}

${data.uptime < 99.9 ? '⚠️ Uptime below target' : '✅ All systems healthy'}
    `.trim();

    return this.send(message);
  }
}

export const telegramAlerter = new TelegramAlerter();
```

### Alert Rules

```yaml
alert_rules:
  critical:
    - name: "App Down"
      condition: "uptime < 100% for 5 minutes"
      action: "immediate_alert + escalate"

    - name: "Payment Processing Broken"
      condition: "payment_failure_rate > 50%"
      action: "immediate_alert + pause_signups"

    - name: "Security Incident"
      condition: "unusual_login_pattern OR brute_force_detected"
      action: "immediate_alert + lock_accounts"

  high:
    - name: "High Error Rate"
      condition: "error_rate > 5%"
      action: "alert + investigate"

    - name: "Revenue Drop"
      condition: "daily_revenue < 50% of average"
      action: "alert + analyze_churn"

    - name: "High Churn"
      condition: "churn_rate > 10%"
      action: "alert + trigger_win_back"

  medium:
    - name: "Slow Response"
      condition: "p95_response > 2000ms"
      action: "log + alert_if_persists"

    - name: "Budget Warning"
      condition: "monthly_spend > 75% of budget"
      action: "alert + reduce_parallelism"

  low:
    - name: "New Signup"
      condition: "new_subscription"
      action: "log + celebrate"

    - name: "Milestone Reached"
      condition: "mrr crosses $1k, $5k, $10k"
      action: "alert + celebrate"
```

---

## ANOMALY DETECTION

```javascript
// anomaly/detector.js
class AnomalyDetector {
  constructor() {
    this.thresholds = {
      revenue: 0.3,      // 30% deviation
      traffic: 0.5,      // 50% deviation
      errors: 2.0,       // 200% deviation
      response_time: 0.5 // 50% deviation
    };
  }

  calculateZScore(value, mean, stdDev) {
    return (value - mean) / stdDev;
  }

  async detectAnomaly(metric, currentValue, historicalData) {
    const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length;
    const stdDev = Math.sqrt(variance);

    const zScore = this.calculateZScore(currentValue, mean, stdDev);
    const percentDeviation = Math.abs((currentValue - mean) / mean);

    const threshold = this.thresholds[metric] || 0.3;
    const isAnomaly = percentDeviation > threshold && Math.abs(zScore) > 2;

    return {
      metric,
      currentValue,
      mean: mean.toFixed(2),
      stdDev: stdDev.toFixed(2),
      zScore: zScore.toFixed(2),
      percentDeviation: (percentDeviation * 100).toFixed(1),
      isAnomaly,
      direction: currentValue > mean ? 'above' : 'below',
      severity: this.calculateSeverity(percentDeviation, zScore)
    };
  }

  calculateSeverity(deviation, zScore) {
    if (Math.abs(zScore) > 4 || deviation > 1) return 'critical';
    if (Math.abs(zScore) > 3 || deviation > 0.5) return 'high';
    if (Math.abs(zScore) > 2 || deviation > 0.3) return 'medium';
    return 'low';
  }

  async runDailyAnomalyCheck(metrics) {
    const anomalies = [];

    for (const [metric, data] of Object.entries(metrics)) {
      const result = await this.detectAnomaly(
        metric,
        data.current,
        data.history
      );

      if (result.isAnomaly) {
        anomalies.push(result);
      }
    }

    return anomalies;
  }
}

export const anomalyDetector = new AnomalyDetector();
```

---

## REPORTING

### Daily Report Generator

```javascript
// reports/daily.js
import { revenueMonitor } from '../monitors/stripe-revenue.js';
import { analyticsMonitor } from '../monitors/posthog-analytics.js';
import { infrastructureMonitor } from '../monitors/infrastructure.js';
import { telegramAlerter } from '../alerts/telegram.js';

async function generateDailyReport(appConfig) {
  // Gather all metrics
  const [revenue, analytics, health] = await Promise.all([
    revenueMonitor.getRevenueMetrics(),
    analyticsMonitor.getDailyActiveUsers(1),
    infrastructureMonitor.runHealthChecks(appConfig.endpoints)
  ]);

  // Calculate today's costs
  const costs = await calculateDailyCosts();

  // Compile report
  const report = {
    date: new Date().toISOString().split('T')[0],
    mrr: revenue.mrr,
    todayRevenue: revenue.last30Days.revenue / 30,
    newSubs: revenue.last30Days.payments,
    dau: analytics[0] || 0,
    sessions: analytics.reduce((a, b) => a + b, 0),
    avgDuration: 5, // Would come from PostHog
    uptime: parseFloat(health.summary.uptime),
    avgResponse: health.summary.avgResponseTime,
    errors: 0,
    costs: costs.today,
    costsMTD: costs.mtd
  };

  // Send report
  await telegramAlerter.alertDailyReport(report);

  // Store in database
  await storeReport('daily', report);

  return report;
}

async function calculateDailyCosts() {
  // Aggregate from cost tracking table
  const today = new Date().toISOString().split('T')[0];
  const mtdStart = today.slice(0, 7) + '-01';

  // Would query from database
  return {
    today: 0.85,
    mtd: 12.50
  };
}

export { generateDailyReport };
```

### Weekly Report

```javascript
// reports/weekly.js
async function generateWeeklyReport(appConfig) {
  const report = {
    period: getWeekRange(),
    revenue: {
      mrr: await getMRR(),
      mrrChange: await getMRRChange('week'),
      newCustomers: await getNewCustomers('week'),
      churnedCustomers: await getChurnedCustomers('week'),
      netRevenue: await getNetRevenue('week')
    },
    growth: {
      wau: await getWAU(),
      wauChange: await getWAUChange(),
      signups: await getSignups('week'),
      trialConversions: await getTrialConversions('week')
    },
    engagement: {
      avgSessionDuration: await getAvgSessionDuration('week'),
      featuresUsed: await getTopFeatures('week'),
      supportTickets: await getSupportTickets('week')
    },
    infrastructure: {
      uptime: await getUptimePercentage('week'),
      avgResponseTime: await getAvgResponseTime('week'),
      incidents: await getIncidents('week')
    },
    costs: {
      total: await getTotalCosts('week'),
      breakdown: await getCostBreakdown('week'),
      budgetUsed: await getBudgetUsedPercentage()
    },
    insights: await generateInsights(),
    recommendations: await generateRecommendations()
  };

  // Format and send
  const formattedReport = formatWeeklyReport(report);
  await telegramAlerter.send(formattedReport);

  return report;
}
```

---

## SUBAGENTS

### Revenue Tracker

```yaml
name: revenue_tracker
model: claude-3-5-haiku
purpose: Monitor Stripe and track all revenue metrics

triggers:
  - webhook: stripe_events
  - scheduled: every_hour

capabilities:
  - Track MRR/ARR in real-time
  - Monitor churn and retention
  - Analyze revenue trends
  - Predict future revenue

output:
  - revenue_dashboard_data
  - anomaly_alerts
  - trend_reports
```

### Health Monitor

```yaml
name: health_monitor
model: claude-3-5-haiku
purpose: Monitor infrastructure health

triggers:
  - scheduled: every_5_minutes
  - webhook: error_reports

capabilities:
  - Ping endpoints
  - Check response times
  - Monitor error rates
  - Track resource usage

output:
  - health_status
  - downtime_alerts
  - performance_reports
```

### Report Generator

```yaml
name: report_generator
model: claude-3-5-haiku
purpose: Generate automated reports

triggers:
  - scheduled: daily_8am, weekly_monday, monthly_1st
  - manual: on_demand

capabilities:
  - Compile metrics from all sources
  - Generate insights
  - Create visualizations
  - Send to stakeholders

output:
  - daily_reports
  - weekly_reports
  - monthly_reports
  - custom_reports
```

### Alert Manager

```yaml
name: alert_manager
model: claude-3-5-haiku
purpose: Process and route alerts

triggers:
  - event: any_alert_triggered

capabilities:
  - Deduplicate alerts
  - Escalate based on severity
  - Track alert resolution
  - Generate alert summaries

rules:
  - critical: immediate_telegram + email
  - high: telegram_within_5min
  - medium: telegram_batched_hourly
  - low: daily_digest
```

---

## COMMANDS

| Command | Description |
|---------|-------------|
| `/revenue` | Show current MRR and recent changes |
| `/health` | Check all systems status |
| `/report [daily/weekly/monthly]` | Generate report |
| `/alert-status` | Show recent alerts and their status |
| `/costs` | Show current cost breakdown |
| `/forecast` | Predict next month's metrics |

---

## KPIs & TARGETS

```yaml
operator_kpis:
  monitoring:
    uptime_detection:
      target: "<1 minute to detect downtime"
    alert_delivery:
      target: "<30 seconds for critical alerts"
    false_positive_rate:
      target: "<5%"

  reporting:
    report_accuracy:
      target: ">99% accurate metrics"
    report_timeliness:
      target: "Always on schedule"

  revenue:
    churn_prediction_accuracy:
      target: ">70% accurate"
    revenue_forecast_accuracy:
      target: "Within 10% of actual"
```

---

*Operator Agent v4.0 - Eyes on revenue, alerts on anomalies*
