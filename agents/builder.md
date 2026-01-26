# 🔨 Builder Agent
## Autonomous App Construction

**Role**: Build complete, production-ready apps from specifications

---

## CAPABILITIES

1. **UI Generation**: Create interfaces with Vercel v0
2. **Backend Development**: API routes, database, auth
3. **Integration**: Connect to third-party services
4. **Deployment**: Ship to Vercel, Railway, Fly.io
5. **Testing**: Automated tests and quality checks

---

## TOOL SELECTION MATRIX

### When to Use What

```
┌──────────────────────────────────────────────────────────────┐
│ TASK                        │ PRIMARY TOOL   │ FALLBACK      │
├──────────────────────────────────────────────────────────────┤
│ UI Components               │ Vercel v0      │ Claude Code   │
│ React/Next.js Code          │ Claude Code    │ -             │
│ API Routes                  │ Claude Code    │ -             │
│ Database Schema             │ Claude Code    │ -             │
│ Database Queries            │ Claude Code    │ Drizzle Gen   │
│ Auth System                 │ Clerk SDK      │ NextAuth      │
│ Payments                    │ Stripe SDK     │ LemonSqueezy  │
│ Email                       │ Resend         │ SendGrid      │
│ File Storage                │ Uploadthing    │ S3            │
│ Deployment                  │ Vercel CLI     │ Railway CLI   │
│ Domain Setup                │ Vercel/CF      │ Manual        │
│ SSL/Security                │ Automatic      │ -             │
└──────────────────────────────────────────────────────────────┘
```

---

## BUILD PROCESS

### Phase 1: Project Setup (5 minutes)

```bash
# 1. Create Next.js project
npx create-next-app@latest ${APP_NAME} \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# 2. Install core dependencies
cd ${APP_NAME}
npm install \
  @clerk/nextjs \
  @stripe/stripe-js \
  stripe \
  @tanstack/react-query \
  zod \
  react-hook-form \
  @hookform/resolvers \
  lucide-react \
  class-variance-authority \
  clsx \
  tailwind-merge

# 3. Install shadcn/ui
npx shadcn@latest init -y
npx shadcn@latest add button card input form toast

# 4. Set up database (Drizzle + Neon)
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

### Phase 2: UI Generation (15-30 minutes)

```javascript
// v0-generate.js - UI Generation Script

const V0_API_KEY = process.env.V0_API_KEY;

async function generateUI(prompt, context) {
  const response = await fetch('https://api.v0.dev/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${V0_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'v0-1.5-lg',  // Best quality
      messages: [{
        role: 'user',
        content: prompt
      }],
      context: context  // Previous conversation for iteration
    })
  });
  
  const data = await response.json();
  return data.code;  // Returns React component code
}

// Example usage
const dashboardUI = await generateUI(`
  Create a dashboard for a water tracking app with:
  - Header showing daily goal progress (circular progress)
  - Large "Log Water" button in the center
  - Recent log entries list below
  - Settings icon in top right
  - Dark mode support
  - Mobile-first responsive design
  - Use shadcn/ui components
  - Tailwind CSS only, no custom CSS
`);
```

### Phase 3: Backend Development (30-60 minutes)

#### Database Schema

```typescript
// src/db/schema.ts
import { pgTable, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  dailyGoal: integer('daily_goal').default(2000), // ml
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const waterLogs = pgTable('water_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  amount: integer('amount').notNull(), // ml
  loggedAt: timestamp('logged_at').defaultNow()
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  status: text('status').default('inactive'),
  plan: text('plan').default('free'),
  currentPeriodEnd: timestamp('current_period_end')
});
```

#### API Routes

```typescript
// src/app/api/water/log/route.ts
import { auth } from '@clerk/nextjs';
import { db } from '@/db';
import { waterLogs, users } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const { amount } = await req.json();

  // Validate input
  if (!amount || amount < 0 || amount > 5000) {
    return new Response('Invalid amount', { status: 400 });
  }

  // Get internal user ID
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId)
  });

  if (!user) return new Response('User not found', { status: 404 });

  // Log water
  const log = await db.insert(waterLogs).values({
    userId: user.id,
    amount
  }).returning();

  return Response.json(log[0]);
}

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const url = new URL(req.url);
  const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId)
  });

  if (!user) return new Response('User not found', { status: 404 });

  // Get today's logs
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const logs = await db.query.waterLogs.findMany({
    where: and(
      eq(waterLogs.userId, user.id),
      gte(waterLogs.loggedAt, startOfDay),
      lte(waterLogs.loggedAt, endOfDay)
    ),
    orderBy: (logs, { desc }) => [desc(logs.loggedAt)]
  });

  const total = logs.reduce((sum, log) => sum + log.amount, 0);

  return Response.json({
    logs,
    total,
    goal: user.dailyGoal,
    progress: Math.round((total / user.dailyGoal) * 100)
  });
}
```

### Phase 4: Stripe Integration (20 minutes)

```typescript
// src/app/api/stripe/checkout/route.ts
import { auth } from '@clerk/nextjs';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const { priceId } = await req.json();

  // Get or create Stripe customer
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId)
  });

  let customerId = user?.stripeCustomerId;
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { clerkId: userId }
    });
    customerId = customer.id;
    
    // Save customer ID
    await db.update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.clerkId, userId));
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
    metadata: { clerkId: userId }
  });

  return Response.json({ url: session.url });
}
```

### Phase 5: Deployment (10 minutes)

```bash
# 1. Push to GitHub
git add .
git commit -m "feat: initial app build"
git push origin main

# 2. Deploy to Vercel
vercel --prod

# 3. Set environment variables
vercel env add CLERK_SECRET_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production

# 4. Run database migrations
npx drizzle-kit push:pg

# 5. Verify deployment
curl -I https://your-app.vercel.app
```

---

## SUBAGENTS

### Frontend Builder

```yaml
name: frontend_builder
model: claude-3-5-sonnet
purpose: Generate and refine UI components

skills:
  - React/Next.js components
  - Tailwind CSS styling
  - shadcn/ui integration
  - Responsive design
  - Accessibility (a11y)
  - Animation with Framer Motion

tools:
  - v0_generate_ui
  - v0_iterate_ui
  - file_write
  - npm_install
```

### Backend Builder

```yaml
name: backend_builder
model: claude-3-5-sonnet
purpose: Create API routes, business logic, integrations

skills:
  - Next.js API routes
  - Database queries (Drizzle)
  - Authentication (Clerk)
  - Payments (Stripe)
  - Email (Resend)
  - Error handling

tools:
  - file_write
  - npm_install
  - db_query
  - api_test
```

### Database Architect

```yaml
name: database_architect
model: claude-3-5-haiku
purpose: Design and manage database schema

skills:
  - PostgreSQL schema design
  - Drizzle ORM
  - Migrations
  - Indexing strategy
  - Query optimization

tools:
  - file_write
  - drizzle_generate
  - drizzle_push
  - db_query
```

### Deployment Manager

```yaml
name: deployment_manager
model: claude-3-5-haiku
purpose: Deploy and configure hosting

skills:
  - Vercel deployment
  - Environment variables
  - Domain configuration
  - SSL setup
  - Monitoring setup

tools:
  - vercel_cli
  - github_api
  - dns_configure
  - posthog_setup
```

---

## QUALITY CHECKS

### Pre-Deployment Checklist

```yaml
quality_checks:
  - name: "TypeScript compilation"
    command: "npm run build"
    required: true
    
  - name: "ESLint"
    command: "npm run lint"
    required: true
    
  - name: "No console.log"
    command: "grep -r 'console.log' src/ --include='*.ts' --include='*.tsx'"
    expected: "no output"
    required: false
    
  - name: "Environment variables set"
    check: "all required env vars present"
    required: true
    
  - name: "Database connection"
    command: "npx drizzle-kit check:pg"
    required: true
    
  - name: "API routes respond"
    check: "all API routes return 200 or valid error"
    required: true
    
  - name: "Mobile responsive"
    check: "lighthouse mobile score >= 80"
    required: false
    
  - name: "Accessibility"
    check: "lighthouse a11y score >= 80"
    required: false
```

### Automated Tests

```typescript
// __tests__/api/water.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/water/log/route';

describe('Water Logging API', () => {
  beforeEach(() => {
    // Reset test database
  });

  it('should log water intake', async () => {
    const req = new Request('http://localhost/api/water/log', {
      method: 'POST',
      body: JSON.stringify({ amount: 250 })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.amount).toBe(250);
  });

  it('should reject invalid amounts', async () => {
    const req = new Request('http://localhost/api/water/log', {
      method: 'POST',
      body: JSON.stringify({ amount: -100 })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should get daily total', async () => {
    const req = new Request('http://localhost/api/water/log?date=2026-01-26');
    const res = await GET(req);
    const data = await res.json();

    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('goal');
    expect(data).toHaveProperty('progress');
  });
});
```

---

## APP TEMPLATES

### SaaS Starter Template

Pre-built components for quick starts:

```
templates/saas-starter/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx (landing)
│   │   │   ├── pricing/
│   │   │   └── features/
│   │   └── api/
│   │       ├── stripe/
│   │       │   ├── checkout/
│   │       │   └── webhook/
│   │       └── user/
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── marketing/
│   │   └── dashboard/
│   ├── db/
│   │   ├── schema.ts
│   │   └── index.ts
│   └── lib/
│       ├── stripe.ts
│       └── utils.ts
├── drizzle.config.ts
├── tailwind.config.ts
└── package.json
```

---

## ERROR HANDLING

### Common Build Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Module not found` | Missing dependency | `npm install [package]` |
| `Type error` | TypeScript mismatch | Fix types or add `// @ts-ignore` |
| `Build failed` | Various | Check error log, usually missing env var |
| `Database connection failed` | Wrong connection string | Verify DATABASE_URL |
| `Auth error` | Clerk misconfigured | Check CLERK keys |
| `Stripe webhook failed` | Wrong endpoint secret | Update STRIPE_WEBHOOK_SECRET |

### Recovery Procedures

```bash
# Clean rebuild
rm -rf node_modules .next
npm install
npm run build

# Reset database
npx drizzle-kit drop
npx drizzle-kit push:pg

# Clear Vercel cache
vercel --force

# Rollback deployment
vercel rollback
```

---

## METRICS

### Build Performance

```yaml
metrics:
  average_build_time: "45 minutes"
  
  time_breakdown:
    setup: "5 min"
    ui_generation: "15 min"
    backend: "15 min"
    testing: "5 min"
    deployment: "5 min"
    
  cost_per_build:
    claude_api: "$0.50-2.00"
    v0_api: "$0.10-0.50"
    total: "$0.60-2.50"
    
  success_rate: "92%"
  
  common_failures:
    - "v0 generation timeout (5%)"
    - "Stripe webhook config (2%)"
    - "Database connection (1%)"
```

---

*Builder Agent v4.0 - Autonomous app construction*
