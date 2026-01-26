# Analytics Skill
## PostHog Integration for Product Analytics

**Purpose**: Track user behavior, run experiments, and gain product insights using PostHog

---

## OVERVIEW

### What is PostHog?

PostHog is an open-source product analytics platform providing:
- Event tracking (pageviews, actions, conversions)
- Session replay (watch user sessions)
- Feature flags (A/B testing, gradual rollouts)
- User identification and properties
- Funnels, cohorts, and retention analysis
- Dashboards and insights

### Pricing (January 2026)

| Feature | Free Tier | Paid |
|---------|-----------|------|
| **Events** | 1M/month | $0.00031/event after |
| **Session Replay** | 5K/month | $0.005/recording |
| **Feature Flags** | 1M requests/month | $0.0001/request |
| **Surveys** | 250 responses/month | $0.01/response |

### When to Use PostHog

```
┌─────────────────────────────────────────────────────────────────┐
│                    POSTHOG USE CASES                            │
├─────────────────────────────────────────────────────────────────┤
│  ALWAYS USE:                                                    │
│  - Pageviews and navigation tracking                            │
│  - Signup/conversion funnels                                    │
│  - Feature adoption tracking                                    │
│  - Error monitoring (with context)                              │
│                                                                 │
│  CONSIDER USING:                                                │
│  - Session replay (for UX issues)                               │
│  - A/B tests (for conversion optimization)                      │
│  - Feature flags (for gradual rollouts)                         │
│                                                                 │
│  SKIP IF:                                                       │
│  - Heavy PII involved (use consent)                             │
│  - Real-time analytics needed (use dedicated tool)              │
│  - Simple landing page (overkill)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## SETUP & INITIALIZATION

### Installation

```bash
# JavaScript/Node.js
npm install posthog-js

# For Node.js server-side
npm install posthog-node

# React-specific
npm install posthog-js @posthog/react
```

### Environment Variables

```bash
# .env
POSTHOG_API_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
POSTHOG_HOST=https://app.posthog.com  # or your self-hosted URL
POSTHOG_PROJECT_ID=12345

# For server-side
POSTHOG_PERSONAL_API_KEY=phx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Client-Side Initialization (React/Next.js)

```typescript
// lib/posthog.ts
import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window === 'undefined') return;

  // Don't init in development unless explicitly enabled
  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_POSTHOG_DEBUG) {
    console.log('PostHog disabled in development');
    return;
  }

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',

    // Capture pageviews automatically
    capture_pageview: true,

    // Capture pageleaves for session duration
    capture_pageleave: true,

    // Session replay settings
    enable_recording_console_log: true,
    session_recording: {
      maskAllInputs: true,  // Privacy: mask form inputs
      maskTextSelector: '.ph-no-capture',  // Mask specific elements
    },

    // Performance settings
    autocapture: true,  // Auto-capture clicks, form submits
    disable_session_recording: false,

    // Privacy
    respect_dnt: true,  // Respect Do Not Track
    opt_out_capturing_by_default: false,

    // Feature flags
    bootstrap: {
      featureFlags: {},  // Pre-load known flags
    },

    loaded: (posthog) => {
      // Debug in development
      if (process.env.NODE_ENV === 'development') {
        posthog.debug();
      }
    },
  });

  return posthog;
}

// Export singleton
export { posthog };
```

### React Provider Setup

```tsx
// app/providers.tsx (Next.js App Router)
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from '@posthog/react';
import { initPostHog } from '@/lib/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

// Pageview tracking component
export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url += '?' + searchParams.toString();
      }
      posthog.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}
```

### Server-Side Initialization (Node.js)

```typescript
// lib/posthog-server.ts
import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

export function getPostHogServer() {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.POSTHOG_API_KEY!, {
      host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
      flushAt: 20,  // Batch size before sending
      flushInterval: 10000,  // Flush every 10 seconds
    });
  }
  return posthogClient;
}

// Graceful shutdown
export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}
```

---

## EVENT TRACKING STRATEGY

### Event Naming Conventions

```typescript
// events/naming-conventions.ts

/**
 * Event Naming Convention:
 * [object]_[action] in snake_case
 *
 * Examples:
 * - user_signed_up
 * - subscription_started
 * - feature_used
 * - error_occurred
 */

export const EVENTS = {
  // User lifecycle
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  USER_DELETED_ACCOUNT: 'user_deleted_account',

  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',

  // Features
  FEATURE_VIEWED: 'feature_viewed',
  FEATURE_USED: 'feature_used',
  FEATURE_ERROR: 'feature_error',

  // Subscription
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',

  // Payments
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',

  // Content
  CONTENT_VIEWED: 'content_viewed',
  CONTENT_SHARED: 'content_shared',
  CONTENT_DOWNLOADED: 'content_downloaded',

  // Support
  SUPPORT_TICKET_CREATED: 'support_ticket_created',
  FEEDBACK_SUBMITTED: 'feedback_submitted',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];
```

### Event Tracking Functions

```typescript
// analytics/track.ts
import posthog from 'posthog-js';
import { EVENTS, EventName } from './naming-conventions';

interface TrackOptions {
  immediate?: boolean;  // Send immediately vs batch
}

// Generic tracking function
export function track(
  event: EventName,
  properties?: Record<string, any>,
  options?: TrackOptions
) {
  posthog.capture(event, {
    timestamp: new Date().toISOString(),
    ...properties,
  });

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PostHog] ${event}`, properties);
  }
}

// User signup tracking
export function trackSignup(
  userId: string,
  method: 'email' | 'google' | 'github',
  properties?: Record<string, any>
) {
  track(EVENTS.USER_SIGNED_UP, {
    signup_method: method,
    $set: {
      signup_date: new Date().toISOString(),
      signup_method: method,
    },
    ...properties,
  });
}

// Feature usage tracking
export function trackFeatureUsed(
  featureName: string,
  properties?: Record<string, any>
) {
  track(EVENTS.FEATURE_USED, {
    feature_name: featureName,
    used_at: new Date().toISOString(),
    ...properties,
  });
}

// Conversion tracking
export function trackConversion(
  conversionType: string,
  value?: number,
  currency?: string,
  properties?: Record<string, any>
) {
  track(EVENTS.PAYMENT_COMPLETED, {
    conversion_type: conversionType,
    value,
    currency: currency || 'USD',
    ...properties,
  });
}

// Error tracking
export function trackError(
  error: Error | string,
  context?: Record<string, any>
) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  track(EVENTS.ERROR_OCCURRED, {
    error_message: errorMessage,
    error_stack: errorStack,
    error_context: context,
  });
}

// Page timing
export function trackPagePerformance() {
  if (typeof window === 'undefined' || !window.performance) return;

  const timing = window.performance.timing;
  const loadTime = timing.loadEventEnd - timing.navigationStart;
  const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

  track('page_performance', {
    load_time_ms: loadTime,
    dom_ready_ms: domReady,
    url: window.location.href,
  });
}
```

### Funnel Tracking

```typescript
// analytics/funnels.ts
import { track } from './track';

// Signup funnel
export const SignupFunnel = {
  viewedLanding: () => track('signup_funnel_viewed_landing'),
  clickedCta: () => track('signup_funnel_clicked_cta'),
  viewedForm: () => track('signup_funnel_viewed_form'),
  startedForm: () => track('signup_funnel_started_form'),
  completedForm: () => track('signup_funnel_completed_form'),
  verified: () => track('signup_funnel_verified'),
};

// Checkout funnel
export const CheckoutFunnel = {
  viewedPricing: () => track('checkout_funnel_viewed_pricing'),
  selectedPlan: (plan: string) => track('checkout_funnel_selected_plan', { plan }),
  startedCheckout: () => track('checkout_funnel_started_checkout'),
  enteredPayment: () => track('checkout_funnel_entered_payment'),
  completed: (value: number) => track('checkout_funnel_completed', { value }),
  abandoned: (step: string) => track('checkout_funnel_abandoned', { step }),
};

// Onboarding funnel
export const OnboardingFunnel = {
  started: () => track('onboarding_started'),
  step: (stepNumber: number, stepName: string) =>
    track('onboarding_step_completed', { step_number: stepNumber, step_name: stepName }),
  completed: (totalSteps: number) =>
    track('onboarding_completed', { total_steps: totalSteps }),
  skipped: (atStep: number) =>
    track('onboarding_skipped', { skipped_at_step: atStep }),
};
```

---

## USER IDENTIFICATION

### Identifying Users

```typescript
// analytics/identify.ts
import posthog from 'posthog-js';

interface UserProperties {
  email?: string;
  name?: string;
  plan?: string;
  company?: string;
  createdAt?: string;
  [key: string]: any;
}

// Identify a user (call after login/signup)
export function identifyUser(userId: string, properties?: UserProperties) {
  posthog.identify(userId, {
    // Set properties on the user profile
    $set: {
      email: properties?.email,
      name: properties?.name,
      plan: properties?.plan,
      company: properties?.company,
      ...properties,
    },
    // Set properties only if not already set
    $set_once: {
      first_seen: new Date().toISOString(),
      signup_date: properties?.createdAt,
    },
  });
}

// Reset user identity (call on logout)
export function resetUser() {
  posthog.reset();
}

// Update user properties
export function setUserProperties(properties: UserProperties) {
  posthog.capture('$set', { $set: properties });
}

// Increment numeric properties
export function incrementUserProperty(property: string, amount: number = 1) {
  posthog.capture('$set', {
    $set: {
      [property]: {
        $add: amount,
      },
    },
  });
}

// Track user groups (for B2B)
export function setUserGroup(groupType: string, groupKey: string, groupProperties?: Record<string, any>) {
  posthog.group(groupType, groupKey, groupProperties);
}
```

### User Properties Strategy

```typescript
// analytics/user-properties.ts

/**
 * Recommended user properties to track:
 */
export interface RecommendedUserProperties {
  // Identity
  email: string;
  name: string;
  avatar_url?: string;

  // Lifecycle
  signup_date: string;
  last_active: string;
  login_count: number;

  // Subscription
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  plan_started_at: string;
  mrr: number;  // Monthly recurring revenue

  // Usage
  features_used: string[];
  total_actions: number;

  // Acquisition
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;

  // Organization (B2B)
  company_name?: string;
  company_size?: string;
  role?: string;
}

// Update user on key actions
export function updateUserOnLogin(user: any) {
  setUserProperties({
    last_active: new Date().toISOString(),
    login_count: { $add: 1 } as any,
  });
}

export function updateUserOnPlanChange(newPlan: string, mrr: number) {
  setUserProperties({
    plan: newPlan,
    plan_started_at: new Date().toISOString(),
    mrr,
  });
}
```

---

## FEATURE FLAGS & A/B TESTING

### Feature Flag Setup

```typescript
// analytics/feature-flags.ts
import posthog from 'posthog-js';

// Get a feature flag value
export function getFeatureFlag(flagKey: string): boolean | string | undefined {
  return posthog.getFeatureFlag(flagKey);
}

// Check if flag is enabled
export function isFeatureEnabled(flagKey: string): boolean {
  return posthog.isFeatureEnabled(flagKey) ?? false;
}

// Get feature flag with payload
export function getFeatureFlagPayload(flagKey: string): any {
  return posthog.getFeatureFlagPayload(flagKey);
}

// React hook for feature flags
export function useFeatureFlag(flagKey: string): boolean | string | undefined {
  const [value, setValue] = useState<boolean | string | undefined>(undefined);

  useEffect(() => {
    // Get initial value
    setValue(getFeatureFlag(flagKey));

    // Listen for changes (e.g., on identify)
    posthog.onFeatureFlags(() => {
      setValue(getFeatureFlag(flagKey));
    });
  }, [flagKey]);

  return value;
}

// React hook with loading state
export function useFeatureFlagWithLoading(flagKey: string) {
  const [state, setState] = useState<{
    value: boolean | string | undefined;
    loading: boolean;
  }>({ value: undefined, loading: true });

  useEffect(() => {
    posthog.onFeatureFlags(() => {
      setState({
        value: getFeatureFlag(flagKey),
        loading: false,
      });
    });

    // Also check immediately in case flags are cached
    const cached = getFeatureFlag(flagKey);
    if (cached !== undefined) {
      setState({ value: cached, loading: false });
    }
  }, [flagKey]);

  return state;
}
```

### A/B Test Implementation

```typescript
// analytics/ab-testing.ts
import posthog from 'posthog-js';

interface Experiment {
  key: string;
  variants: string[];
  defaultVariant: string;
}

// Define experiments
export const EXPERIMENTS: Record<string, Experiment> = {
  PRICING_PAGE: {
    key: 'pricing-page-test',
    variants: ['control', 'variant-a', 'variant-b'],
    defaultVariant: 'control',
  },
  SIGNUP_FLOW: {
    key: 'signup-flow-test',
    variants: ['control', 'simplified'],
    defaultVariant: 'control',
  },
  CTA_COLOR: {
    key: 'cta-color-test',
    variants: ['blue', 'green', 'orange'],
    defaultVariant: 'blue',
  },
};

// Get experiment variant for user
export function getExperimentVariant(experimentKey: string): string {
  const experiment = Object.values(EXPERIMENTS).find(e => e.key === experimentKey);
  if (!experiment) return 'control';

  const variant = posthog.getFeatureFlag(experimentKey);
  return (variant as string) || experiment.defaultVariant;
}

// Track experiment exposure
export function trackExperimentExposure(experimentKey: string, variant: string) {
  posthog.capture('$experiment_exposure', {
    experiment: experimentKey,
    variant,
    exposed_at: new Date().toISOString(),
  });
}

// React hook for experiments
export function useExperiment(experimentKey: string) {
  const variant = useFeatureFlag(experimentKey) as string;
  const experiment = Object.values(EXPERIMENTS).find(e => e.key === experimentKey);

  useEffect(() => {
    if (variant) {
      trackExperimentExposure(experimentKey, variant);
    }
  }, [experimentKey, variant]);

  return {
    variant: variant || experiment?.defaultVariant || 'control',
    isControl: variant === 'control' || variant === undefined,
  };
}

// Component for A/B testing
export function ABTest({
  experimentKey,
  variants,
  fallback,
}: {
  experimentKey: string;
  variants: Record<string, React.ReactNode>;
  fallback?: React.ReactNode;
}) {
  const { variant, isLoading } = useFeatureFlagWithLoading(experimentKey);

  if (isLoading) {
    return fallback || null;
  }

  return variants[variant as string] || variants['control'] || fallback;
}
```

---

## SESSION REPLAY

### Session Replay Configuration

```typescript
// analytics/session-replay.ts
import posthog from 'posthog-js';

// Configure session replay
export function configureSessionReplay() {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY!, {
    session_recording: {
      // Mask all text inputs
      maskAllInputs: true,

      // Mask specific elements
      maskTextSelector: '.sensitive-data, .ph-no-capture',

      // Block specific elements entirely
      blockSelector: '.session-replay-block',

      // Mask specific input types
      maskInputOptions: {
        password: true,
        email: true,
        tel: true,
      },

      // Recording settings
      recordCanvas: false,  // Don't record canvas elements
      recordCrossOriginIframes: false,

      // Console log recording
      consoleLogRecordingEnabled: true,
    },
  });
}

// Start recording (if not auto-started)
export function startSessionRecording() {
  posthog.startSessionRecording();
}

// Stop recording
export function stopSessionRecording() {
  posthog.stopSessionRecording();
}

// Check if recording is active
export function isRecording(): boolean {
  return posthog.sessionRecordingStarted();
}

// Add tag to current session (for searching)
export function tagSession(tag: string) {
  posthog.capture('$session_tag', { tag });
}
```

### Privacy Controls

```typescript
// analytics/privacy.ts
import posthog from 'posthog-js';

// Opt user out of tracking
export function optOutTracking() {
  posthog.opt_out_capturing();
  localStorage.setItem('posthog_opt_out', 'true');
}

// Opt user back in
export function optInTracking() {
  posthog.opt_in_capturing();
  localStorage.removeItem('posthog_opt_out');
}

// Check opt-out status
export function isOptedOut(): boolean {
  return posthog.has_opted_out_capturing() ||
    localStorage.getItem('posthog_opt_out') === 'true';
}

// Consent management component
export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has made a choice
    const hasConsented = localStorage.getItem('posthog_consent');
    if (!hasConsented) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('posthog_consent', 'accepted');
    optInTracking();
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('posthog_consent', 'declined');
    optOutTracking();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="consent-banner">
      <p>We use analytics to improve your experience.</p>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleDecline}>Decline</button>
    </div>
  );
}
```

---

## DASHBOARD CREATION VIA API

### PostHog API Client

```typescript
// api/posthog-api.ts
class PostHogAPI {
  private apiKey: string;
  private projectId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.POSTHOG_PERSONAL_API_KEY!;
    this.projectId = process.env.POSTHOG_PROJECT_ID!;
    this.baseUrl = process.env.POSTHOG_HOST || 'https://app.posthog.com';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}/api/projects/${this.projectId}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PostHog API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Create an insight (chart/metric)
  async createInsight(insight: InsightDefinition) {
    return this.request('/insights/', {
      method: 'POST',
      body: JSON.stringify(insight),
    });
  }

  // Create a dashboard
  async createDashboard(name: string, description?: string) {
    return this.request('/dashboards/', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  // Add insight to dashboard
  async addInsightToDashboard(dashboardId: number, insightId: number) {
    return this.request(`/dashboards/${dashboardId}/insights/`, {
      method: 'POST',
      body: JSON.stringify({ insight_id: insightId }),
    });
  }

  // Query insights
  async queryInsight(query: InsightQuery) {
    return this.request('/query/', {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }

  // Get events
  async getEvents(filters?: EventFilters) {
    const params = new URLSearchParams(filters as any);
    return this.request(`/events/?${params}`);
  }

  // Get persons (users)
  async getPersons(filters?: PersonFilters) {
    const params = new URLSearchParams(filters as any);
    return this.request(`/persons/?${params}`);
  }
}

export const posthogAPI = new PostHogAPI();
```

### Insight Definitions

```typescript
// api/insights.ts
interface InsightDefinition {
  name: string;
  description?: string;
  filters: {
    insight: 'TRENDS' | 'FUNNELS' | 'RETENTION' | 'PATHS' | 'LIFECYCLE';
    events?: EventFilter[];
    actions?: ActionFilter[];
    properties?: PropertyFilter[];
    date_from?: string;
    date_to?: string;
    interval?: 'hour' | 'day' | 'week' | 'month';
  };
}

// Create a trends insight
export function createTrendsInsight(
  name: string,
  events: string[],
  options?: {
    interval?: 'hour' | 'day' | 'week' | 'month';
    dateFrom?: string;
  }
): InsightDefinition {
  return {
    name,
    filters: {
      insight: 'TRENDS',
      events: events.map(event => ({
        id: event,
        math: 'total',
        type: 'events',
      })),
      interval: options?.interval || 'day',
      date_from: options?.dateFrom || '-30d',
    },
  };
}

// Create a funnel insight
export function createFunnelInsight(
  name: string,
  steps: string[]
): InsightDefinition {
  return {
    name,
    filters: {
      insight: 'FUNNELS',
      events: steps.map((step, index) => ({
        id: step,
        order: index,
        type: 'events',
      })),
      funnel_window_days: 14,
      date_from: '-30d',
    },
  };
}

// Create a retention insight
export function createRetentionInsight(
  name: string,
  startEvent: string,
  returnEvent: string
): InsightDefinition {
  return {
    name,
    filters: {
      insight: 'RETENTION',
      target_entity: { id: startEvent, type: 'events' },
      returning_entity: { id: returnEvent, type: 'events' },
      period: 'Week',
      retention_type: 'retention_first_time',
      date_from: '-30d',
    },
  };
}
```

### Create Full Dashboard

```typescript
// api/create-dashboard.ts
import { posthogAPI } from './posthog-api';
import { createTrendsInsight, createFunnelInsight, createRetentionInsight } from './insights';

async function createAppDashboard(appName: string) {
  // 1. Create the dashboard
  const dashboard = await posthogAPI.createDashboard(
    `${appName} - Overview`,
    `Analytics dashboard for ${appName}`
  );

  console.log(`Created dashboard: ${dashboard.id}`);

  // 2. Create insights
  const insights = [
    // Daily active users
    createTrendsInsight('Daily Active Users', ['$pageview'], { interval: 'day' }),

    // Signups over time
    createTrendsInsight('Daily Signups', ['user_signed_up'], { interval: 'day' }),

    // Signup funnel
    createFunnelInsight('Signup Funnel', [
      'signup_funnel_viewed_landing',
      'signup_funnel_clicked_cta',
      'signup_funnel_completed_form',
      'signup_funnel_verified',
    ]),

    // Checkout funnel
    createFunnelInsight('Checkout Funnel', [
      'checkout_funnel_viewed_pricing',
      'checkout_funnel_selected_plan',
      'checkout_funnel_completed',
    ]),

    // User retention
    createRetentionInsight('Weekly Retention', 'user_signed_up', '$pageview'),

    // Feature usage
    createTrendsInsight('Feature Usage', ['feature_used'], { interval: 'week' }),
  ];

  // 3. Create each insight and add to dashboard
  for (const insightDef of insights) {
    const insight = await posthogAPI.createInsight(insightDef);
    await posthogAPI.addInsightToDashboard(dashboard.id, insight.id);
    console.log(`Added insight: ${insightDef.name}`);
  }

  return {
    dashboardId: dashboard.id,
    dashboardUrl: `${process.env.POSTHOG_HOST}/dashboard/${dashboard.id}`,
  };
}

export { createAppDashboard };
```

---

## QUERYING INSIGHTS PROGRAMMATICALLY

### Query API

```typescript
// api/query.ts
import { posthogAPI } from './posthog-api';

// Get events count for a time period
async function getEventsCount(
  eventName: string,
  dateFrom: string = '-30d',
  dateTo: string = 'now'
) {
  const result = await posthogAPI.queryInsight({
    kind: 'EventsQuery',
    select: ['count()'],
    event: eventName,
    after: dateFrom,
    before: dateTo,
  });

  return result.results[0][0];
}

// Get unique users count
async function getUniqueUsers(
  dateFrom: string = '-30d',
  dateTo: string = 'now'
) {
  const result = await posthogAPI.queryInsight({
    kind: 'EventsQuery',
    select: ['count(distinct person_id)'],
    event: '$pageview',
    after: dateFrom,
    before: dateTo,
  });

  return result.results[0][0];
}

// Get conversion rate for a funnel
async function getFunnelConversion(steps: string[]) {
  const result = await posthogAPI.queryInsight({
    kind: 'FunnelsQuery',
    series: steps.map(step => ({
      event: step,
      kind: 'EventsNode',
    })),
    funnelsFilter: {
      funnelWindowIntervalUnit: 'day',
      funnelWindowInterval: 14,
    },
    dateRange: {
      date_from: '-30d',
    },
  });

  // Calculate conversion rate
  const firstStep = result.results[0]?.count || 0;
  const lastStep = result.results[result.results.length - 1]?.count || 0;

  return {
    rate: firstStep > 0 ? (lastStep / firstStep) * 100 : 0,
    steps: result.results,
  };
}

// Get trending events
async function getTrendingEvents(limit: number = 10) {
  const result = await posthogAPI.queryInsight({
    kind: 'EventsQuery',
    select: ['event', 'count()'],
    after: '-7d',
    orderBy: ['count() DESC'],
    limit,
  });

  return result.results.map(([event, count]: [string, number]) => ({
    event,
    count,
  }));
}

export { getEventsCount, getUniqueUsers, getFunnelConversion, getTrendingEvents };
```

### Automated Reporting

```typescript
// api/reporting.ts
import { getEventsCount, getUniqueUsers, getFunnelConversion } from './query';

interface WeeklyReport {
  period: string;
  metrics: {
    uniqueUsers: number;
    totalPageviews: number;
    signups: number;
    conversions: number;
    revenue: number;
  };
  funnels: {
    signup: { rate: number };
    checkout: { rate: number };
  };
  topEvents: Array<{ event: string; count: number }>;
}

async function generateWeeklyReport(): Promise<WeeklyReport> {
  const [
    uniqueUsers,
    pageviews,
    signups,
    conversions,
    signupFunnel,
    checkoutFunnel,
    topEvents,
  ] = await Promise.all([
    getUniqueUsers('-7d'),
    getEventsCount('$pageview', '-7d'),
    getEventsCount('user_signed_up', '-7d'),
    getEventsCount('payment_completed', '-7d'),
    getFunnelConversion([
      'signup_funnel_viewed_landing',
      'signup_funnel_completed_form',
    ]),
    getFunnelConversion([
      'checkout_funnel_viewed_pricing',
      'checkout_funnel_completed',
    ]),
    getTrendingEvents(10),
  ]);

  return {
    period: `${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
    metrics: {
      uniqueUsers,
      totalPageviews: pageviews,
      signups,
      conversions,
      revenue: conversions * 29,  // Assuming $29 average
    },
    funnels: {
      signup: { rate: signupFunnel.rate },
      checkout: { rate: checkoutFunnel.rate },
    },
    topEvents,
  };
}

// Send report via webhook/email
async function sendWeeklyReport(webhookUrl: string) {
  const report = await generateWeeklyReport();

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Weekly Analytics Report',
      ...report,
    }),
  });

  return report;
}

export { generateWeeklyReport, sendWeeklyReport };
```

---

## COMPLETE INTEGRATION EXAMPLE

### Full Setup

```typescript
// analytics/index.ts
export * from './track';
export * from './identify';
export * from './feature-flags';
export * from './session-replay';
export * from './privacy';

// Main initialization
import { initPostHog, posthog } from '@/lib/posthog';
import { identifyUser, resetUser } from './identify';
import { track, EVENTS } from './track';

export {
  initPostHog,
  posthog,
  identifyUser,
  resetUser,
  track,
  EVENTS,
};
```

### Usage in Application

```tsx
// app/layout.tsx
import { PostHogProvider, PostHogPageview } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PostHogProvider>
          <PostHogPageview />
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}

// components/signup-form.tsx
import { trackSignup, identifyUser, SignupFunnel } from '@/analytics';

function SignupForm() {
  const handleSubmit = async (data) => {
    SignupFunnel.startedForm();

    const user = await createUser(data);

    // Identify user in PostHog
    identifyUser(user.id, {
      email: user.email,
      name: user.name,
      plan: 'free',
    });

    // Track signup
    trackSignup(user.id, 'email');

    SignupFunnel.completedForm();
  };

  return <form onSubmit={handleSubmit}>...</form>;
}

// components/feature-gate.tsx
import { useFeatureFlag } from '@/analytics';

function PremiumFeature({ children }) {
  const isEnabled = useFeatureFlag('premium-feature-beta');

  if (!isEnabled) {
    return <UpgradePrompt />;
  }

  return children;
}
```

---

## BEST PRACTICES

### Do's
- Track meaningful events (not everything)
- Use consistent event naming conventions
- Identify users as early as possible
- Set up funnels for key conversion paths
- Respect user privacy (GDPR, CCPA)
- Use feature flags for gradual rollouts

### Don'ts
- Don't track PII in event properties
- Don't create too many custom events (focus on key actions)
- Don't ignore session replays (goldmine for UX insights)
- Don't A/B test without sufficient traffic
- Don't forget to track errors with context

---

*Analytics Skill v4.0 - PostHog Integration*
