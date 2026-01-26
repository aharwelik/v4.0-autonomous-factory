# Deploy App Workflow
## Complete Guide to Automated Deployment

**Version**: 4.0
**Duration**: 15-45 minutes
**Agents Involved**: Builder (deployment_manager subagent), Operator

---

## WORKFLOW OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DEPLOY APP WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 1         Step 2           Step 3          Step 4                  │
│  ┌─────┐        ┌─────┐          ┌─────┐         ┌─────┐                │
│  │ GIT │ ─────> │ ENV │ ─────>   │DEPLOY│ ─────> │ DNS │                │
│  └─────┘        └─────┘          └─────┘         └─────┘                │
│  5 min          5 min            10 min          5 min                   │
│                                                                          │
│  Step 5         Step 6           Step 7          Step 8                  │
│  ┌─────┐        ┌─────┐          ┌─────┐         ┌─────┐                │
│  │ SSL │ ─────> │ DB  │ ─────>   │HOOK │ ─────>  │TEST │ ─────> LIVE   │
│  └─────┘        └─────┘          └─────┘         └─────┘                │
│  Auto           5 min            5 min           5 min                   │
│                                                                          │
│  TOTAL ESTIMATED TIME: 30-45 minutes                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## PREREQUISITES

### From Build Workflow

```yaml
required_from_build:
  - app_name: "Name of the application"
  - source_path: "Path to built application"
  - env_template: "List of required environment variables"
  - database_schema: "Drizzle schema file"
  - validation_score: "From researcher validation"
```

### Required Accounts

```yaml
deployment_accounts:
  vercel:
    required: true
    url: "https://vercel.com"
    needed_for: "Primary deployment platform"

  github:
    required: true
    url: "https://github.com"
    needed_for: "Code repository"

  domain_registrar:
    required: false
    options:
      - "Cloudflare (recommended)"
      - "Namecheap"
      - "Google Domains"
      - "Vercel Domains"

  database_provider:
    required: true
    options:
      - name: "Neon"
        url: "https://neon.tech"
        recommended: true
      - name: "Supabase"
        url: "https://supabase.com"
      - name: "PlanetScale"
        url: "https://planetscale.com"
```

### Required CLI Tools

```bash
# Verify installations
vercel --version    # Vercel CLI
gh --version        # GitHub CLI
git --version       # Git

# Install if needed
npm install -g vercel
brew install gh  # or: winget install GitHub.cli
```

---

## STEP 1: GIT REPOSITORY SETUP
**Duration**: 5 minutes
**Agent**: Builder (deployment_manager)

### Initialize Repository

```bash
# Navigate to app directory
cd /path/to/${APP_NAME}

# Initialize git if not already
if [ ! -d .git ]; then
  git init
fi

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
.next/
out/
dist/
build/

# Environment files
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/

# Misc
*.pem
EOF

# Add all files
git add .

# Initial commit
git commit -m "feat: initial commit - ${APP_NAME}"
```

### Create GitHub Repository

```bash
# Using GitHub CLI
gh repo create ${APP_NAME} \
  --private \
  --source=. \
  --remote=origin \
  --push

# Or manually:
# 1. Create repo on github.com
# 2. git remote add origin https://github.com/${USERNAME}/${APP_NAME}.git
# 3. git push -u origin main
```

### Branch Protection (Optional)

```bash
# Set up branch protection for main
gh api repos/${USERNAME}/${APP_NAME}/branches/main/protection \
  -X PUT \
  -F required_status_checks='{"strict":true,"contexts":["build"]}' \
  -F enforce_admins=false \
  -F required_pull_request_reviews='{"required_approving_review_count":1}'
```

---

## STEP 2: ENVIRONMENT VARIABLES
**Duration**: 5 minutes
**Agent**: Builder (deployment_manager)

### Environment Variables List

```yaml
environment_variables:
  # Authentication (Clerk)
  - name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    description: "Clerk public key for client-side auth"
    secret: false
    get_from: "Clerk Dashboard > API Keys"

  - name: CLERK_SECRET_KEY
    description: "Clerk secret key for server-side auth"
    secret: true
    get_from: "Clerk Dashboard > API Keys"

  - name: CLERK_WEBHOOK_SECRET
    description: "Secret for verifying Clerk webhooks"
    secret: true
    get_from: "Clerk Dashboard > Webhooks > Signing Secret"

  # Database
  - name: DATABASE_URL
    description: "PostgreSQL connection string"
    secret: true
    format: "postgresql://user:pass@host:5432/db?sslmode=require"
    get_from: "Database provider dashboard"

  # Payments (Stripe)
  - name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    description: "Stripe public key for client-side"
    secret: false
    get_from: "Stripe Dashboard > Developers > API Keys"

  - name: STRIPE_SECRET_KEY
    description: "Stripe secret key for server-side"
    secret: true
    get_from: "Stripe Dashboard > Developers > API Keys"

  - name: STRIPE_WEBHOOK_SECRET
    description: "Secret for verifying Stripe webhooks"
    secret: true
    get_from: "Stripe Dashboard > Webhooks > Signing secret"

  - name: STRIPE_PRO_PRICE_ID
    description: "Price ID for Pro plan"
    secret: false
    get_from: "Stripe Dashboard > Products > Price ID"

  # Analytics (PostHog)
  - name: NEXT_PUBLIC_POSTHOG_KEY
    description: "PostHog project API key"
    secret: false
    get_from: "PostHog > Project Settings > Project API Key"

  - name: NEXT_PUBLIC_POSTHOG_HOST
    description: "PostHog host URL"
    secret: false
    default: "https://app.posthog.com"

  # Email (Resend)
  - name: RESEND_API_KEY
    description: "Resend API key for sending emails"
    secret: true
    get_from: "Resend Dashboard > API Keys"

  # App Configuration
  - name: NEXT_PUBLIC_APP_URL
    description: "Public URL of the deployed app"
    secret: false
    format: "https://yourdomain.com"
```

### Create .env.production Template

```bash
# Generate .env.production.template
cat > .env.production.template << 'EOF'
# ================================================
# PRODUCTION ENVIRONMENT VARIABLES
# Copy to .env.local for local development
# Add to Vercel for production deployment
# ================================================

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database (Neon/Supabase/PlanetScale)
DATABASE_URL=postgresql://...

# Payments (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...

# Analytics (PostHog)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Email (Resend)
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
EOF
```

### Secure Secrets Management

```yaml
secrets_checklist:
  never_commit:
    - ".env"
    - ".env.local"
    - ".env.production"
    - "Any file with API keys"

  store_in:
    primary: "Vercel Environment Variables"
    backup: "1Password / Bitwarden vault"

  rotation_schedule:
    api_keys: "Every 90 days"
    webhook_secrets: "On security incidents"
    database_passwords: "Every 90 days"
```

---

## STEP 3: VERCEL DEPLOYMENT
**Duration**: 10 minutes
**Agent**: Builder (deployment_manager)

### Option A: Vercel CLI Deployment

```bash
# Login to Vercel (if not already)
vercel login

# Link to project (first time)
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Add environment variables
vercel env add CLERK_SECRET_KEY production
vercel env add DATABASE_URL production
vercel env add STRIPE_SECRET_KEY production
# ... repeat for all env vars

# Or bulk import from file
vercel env pull .env.vercel.local
```

### Option B: GitHub Integration

```mermaid
graph TD
    A[Push to GitHub] --> B[Vercel Detects Change]
    B --> C[Build Triggered]
    C --> D{Build Success?}
    D -->|Yes| E[Deploy Preview]
    D -->|No| F[Alert + Logs]
    E --> G{Main Branch?}
    G -->|Yes| H[Deploy Production]
    G -->|No| I[Preview URL]
```

**Setup Steps:**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import Git Repository
3. Select your repository
4. Configure:
   - Framework: Next.js (auto-detected)
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: .next
5. Add Environment Variables
6. Click Deploy

### Vercel Configuration File

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/health",
      "destination": "/api/health"
    }
  ]
}
```

### Railway Alternative

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to existing project
railway link

# Deploy
railway up

# Add environment variables
railway variables set CLERK_SECRET_KEY=sk_live_...
railway variables set DATABASE_URL=postgresql://...

# Get deployment URL
railway open
```

### Deployment Checklist

```yaml
pre_deployment:
  - [ ] All environment variables documented
  - [ ] Build passes locally
  - [ ] No console.log statements
  - [ ] No hardcoded secrets
  - [ ] Database migrations ready

during_deployment:
  - [ ] Build completes without errors
  - [ ] No TypeScript errors
  - [ ] Environment variables loaded

post_deployment:
  - [ ] Preview URL accessible
  - [ ] API routes responding
  - [ ] Auth flow works
  - [ ] Database connected
```

---

## STEP 4: DOMAIN CONFIGURATION
**Duration**: 5-10 minutes
**Agent**: Builder (deployment_manager)

### Option A: Vercel Domains

```bash
# Add custom domain via CLI
vercel domains add yourdomain.com

# Or in Vercel Dashboard:
# 1. Go to Project Settings > Domains
# 2. Enter domain name
# 3. Follow DNS configuration instructions
```

### Option B: Cloudflare DNS

```mermaid
graph LR
    A[yourdomain.com] --> B[Cloudflare DNS]
    B --> C[CNAME to Vercel]
    C --> D[Your App]
```

**DNS Configuration:**

```yaml
cloudflare_dns_records:
  # Root domain
  - type: CNAME
    name: "@"
    content: "cname.vercel-dns.com"
    proxy: true  # Orange cloud ON

  # WWW subdomain
  - type: CNAME
    name: "www"
    content: "cname.vercel-dns.com"
    proxy: true

  # Or for A record (if CNAME flattening not available)
  - type: A
    name: "@"
    content: "76.76.21.21"
    proxy: true
```

**Cloudflare SSL Settings:**

```yaml
cloudflare_ssl:
  ssl_mode: "Full (strict)"
  always_use_https: true
  minimum_tls: "1.2"
  automatic_https_rewrites: true
```

### DNS Propagation Check

```bash
# Check DNS propagation
dig yourdomain.com

# Check from multiple locations
# Use: https://dnschecker.org

# Verify in Vercel
vercel domains inspect yourdomain.com
```

### Subdomain Setup

```yaml
subdomains:
  app:
    dns: "app.yourdomain.com -> cname.vercel-dns.com"
    purpose: "Main application"

  api:
    dns: "api.yourdomain.com -> cname.vercel-dns.com"
    purpose: "API endpoints (optional)"

  docs:
    dns: "docs.yourdomain.com -> cname.vercel-dns.com"
    purpose: "Documentation (optional)"
```

---

## STEP 5: SSL/HTTPS SETUP
**Duration**: Automatic (0-5 minutes)
**Agent**: Automated

### Vercel SSL (Automatic)

```yaml
vercel_ssl:
  provider: "Let's Encrypt"
  renewal: "Automatic"
  setup_time: "< 5 minutes after DNS verification"

  status_check:
    url: "https://yourdomain.com"
    expected: "Valid SSL certificate"
```

### Cloudflare SSL Options

```yaml
cloudflare_ssl_modes:
  full_strict:
    description: "End-to-end encryption with valid cert"
    recommended: true
    requirements: "Valid SSL on origin (Vercel provides)"

  full:
    description: "End-to-end encryption"
    recommended: false
    note: "Allows self-signed certs on origin"

  flexible:
    description: "Browser to Cloudflare only"
    recommended: false
    note: "Not secure, avoid"
```

### SSL Verification

```bash
# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check certificate chain
curl -vI https://yourdomain.com

# Test SSL configuration
# Use: https://www.ssllabs.com/ssltest/
```

---

## STEP 6: DATABASE MIGRATION
**Duration**: 5 minutes
**Agent**: Builder (database_architect)

### Drizzle Migration

```bash
# Generate migration files (if not already)
npx drizzle-kit generate:pg

# Push schema to production database
DATABASE_URL="your_production_url" npx drizzle-kit push:pg

# Verify tables created
DATABASE_URL="your_production_url" npx drizzle-kit check:pg
```

### Neon-Specific Setup

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

```bash
# Neon CLI operations (optional)
neonctl branches list
neonctl databases list
neonctl connection-string
```

### Database Health Check

```typescript
// src/app/api/health/route.ts
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test database connection
    await db.execute(sql`SELECT 1`);

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

### Migration Rollback

```bash
# If migration fails, roll back
npx drizzle-kit drop  # CAUTION: This drops all tables

# For partial rollback, manually:
# 1. Connect to database
# 2. DROP TABLE specific_table;
# 3. Re-run migration
```

---

## STEP 7: WEBHOOK CONFIGURATION
**Duration**: 5-10 minutes
**Agent**: Builder (deployment_manager)

### Clerk Webhook Setup

1. **Go to Clerk Dashboard** > Webhooks
2. **Add Endpoint**:
   - URL: `https://yourdomain.com/api/webhooks/clerk`
   - Events:
     - `user.created`
     - `user.updated`
     - `user.deleted`
3. **Copy Signing Secret** to `CLERK_WEBHOOK_SECRET`

```yaml
clerk_webhook:
  endpoint: "https://yourdomain.com/api/webhooks/clerk"
  events:
    - user.created
    - user.updated
    - user.deleted
  verification:
    method: "svix signature"
    header: "svix-signature"
```

### Stripe Webhook Setup

1. **Go to Stripe Dashboard** > Developers > Webhooks
2. **Add Endpoint**:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
3. **Copy Signing Secret** to `STRIPE_WEBHOOK_SECRET`

```bash
# Test Stripe webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

```yaml
stripe_webhook:
  endpoint: "https://yourdomain.com/api/webhooks/stripe"
  events:
    - checkout.session.completed
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.paid
    - invoice.payment_failed
  verification:
    method: "stripe signature"
    header: "stripe-signature"
```

### PostHog Setup

```typescript
// Verify PostHog is receiving events
// Check PostHog Dashboard > Activity

// Test event
import posthog from 'posthog-js';
posthog.capture('test_event', { test: true });
```

```yaml
posthog_setup:
  project_api_key: "Add to NEXT_PUBLIC_POSTHOG_KEY"
  host: "https://app.posthog.com"
  events_to_track:
    - page_view
    - sign_up
    - sign_in
    - subscription_started
    - feature_used
```

### Webhook Testing

```bash
# Test Clerk webhook
curl -X POST https://yourdomain.com/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"type":"user.created","data":{"id":"test"}}'
# Should return 401 (no valid signature)

# Test Stripe webhook (use Stripe CLI)
stripe trigger payment_intent.succeeded

# Test health endpoint
curl https://yourdomain.com/api/health
```

---

## STEP 8: SMOKE TESTING
**Duration**: 5 minutes
**Agent**: Builder + Operator

### Automated Smoke Test

```bash
#!/bin/bash
# smoke-test-production.sh

DOMAIN=${1:-"yourdomain.com"}
BASE_URL="https://${DOMAIN}"

echo "======================================"
echo "Production Smoke Test: ${DOMAIN}"
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass() { echo -e "${GREEN}PASS${NC}"; }
fail() { echo -e "${RED}FAIL${NC}"; }

# 1. Homepage
echo -n "Homepage loads... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
[ "$STATUS" = "200" ] && pass || fail

# 2. SSL Certificate
echo -n "SSL valid... "
curl -s --fail "https://${DOMAIN}" > /dev/null 2>&1 && pass || fail

# 3. API Health
echo -n "API health... "
HEALTH=$(curl -s "$BASE_URL/api/health" | jq -r '.status')
[ "$HEALTH" = "healthy" ] && pass || fail

# 4. Database connection
echo -n "Database connected... "
DB=$(curl -s "$BASE_URL/api/health" | jq -r '.database')
[ "$DB" = "connected" ] && pass || fail

# 5. Auth pages
echo -n "Sign-in page... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/sign-in")
[ "$STATUS" = "200" ] && pass || fail

# 6. Protected route redirect
echo -n "Protected route redirects... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/dashboard")
[ "$STATUS" = "200" ] && pass || fail

# 7. Response time
echo -n "Response time < 2s... "
TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL")
(( $(echo "$TIME < 2" | bc -l) )) && pass || fail

# 8. No console errors (check manually)
echo "Manual check: Open browser console, verify no errors"

echo "======================================"
echo "Smoke test complete"
echo "======================================"
```

### Manual Testing Checklist

```yaml
manual_tests:
  authentication:
    - [ ] Sign up with email
    - [ ] Sign in works
    - [ ] Sign out works
    - [ ] OAuth login (if configured)

  core_features:
    - [ ] Create a test item
    - [ ] Read/list items
    - [ ] Update item
    - [ ] Delete item

  payments:
    - [ ] Pricing page loads
    - [ ] Checkout redirects to Stripe
    - [ ] Test card works (4242424242424242)
    - [ ] Subscription appears after payment

  responsive:
    - [ ] Test on mobile viewport
    - [ ] Test on tablet viewport
    - [ ] Test on desktop

  performance:
    - [ ] Lighthouse score > 80
    - [ ] First contentful paint < 2s
    - [ ] Time to interactive < 3s
```

### Lighthouse Audit

```bash
# Run Lighthouse via CLI
npx lighthouse https://yourdomain.com \
  --output=html \
  --output-path=./lighthouse-report.html

# Or use Chrome DevTools:
# 1. Open Chrome DevTools (F12)
# 2. Go to Lighthouse tab
# 3. Run audit
```

---

## ROLLBACK PROCEDURES

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback

# Or rollback to specific deployment
vercel rollback [deployment-url]

# Instant rollback via dashboard:
# 1. Go to Vercel Dashboard > Deployments
# 2. Find previous working deployment
# 3. Click "..." > "Promote to Production"
```

### Database Rollback

```bash
# If schema change broke things:

# 1. Connect to database
psql $DATABASE_URL

# 2. Check current state
\dt  # List tables

# 3. Manual fix (example: drop column)
ALTER TABLE users DROP COLUMN problematic_column;

# 4. Or restore from backup (if available)
# Neon: Restore from branch point
# Supabase: Restore from daily backup
```

### Git Rollback

```bash
# Revert last commit
git revert HEAD

# Push revert
git push origin main

# Vercel will auto-deploy reverted code

# For multiple commits:
git revert HEAD~3..HEAD  # Revert last 3 commits
```

### Emergency Procedures

```yaml
emergency_rollback:
  level_1_app_broken:
    steps:
      - "Vercel: Instant rollback to last working deployment"
      - "Notify: Alert team via Telegram"
      - "Investigate: Check Vercel logs"

  level_2_database_issue:
    steps:
      - "Pause: Set maintenance mode"
      - "Backup: Export current data if possible"
      - "Restore: Use database provider's backup"
      - "Fix: Apply corrected migration"

  level_3_security_incident:
    steps:
      - "Rotate: All API keys immediately"
      - "Block: Suspicious IPs via Cloudflare"
      - "Audit: Review access logs"
      - "Notify: Users if data exposed"
```

---

## MONITORING SETUP

### PostHog Integration

```typescript
// src/providers/posthog-provider.tsx
'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: false
      });
    }
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

```typescript
// src/app/layout.tsx
import { PHProvider } from '@/providers/posthog-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PHProvider>{children}</PHProvider>
      </body>
    </html>
  );
}
```

### Vercel Analytics (Optional)

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to layout
import { Analytics } from '@vercel/analytics/react';

// In layout:
<Analytics />
```

### Uptime Monitoring

```yaml
uptime_monitoring:
  options:
    - name: "Vercel Monitoring"
      cost: "Included with Pro"
      setup: "Automatic"

    - name: "UptimeRobot"
      cost: "Free tier available"
      setup: "Add URL to monitor"

    - name: "Better Uptime"
      cost: "Free tier available"
      setup: "Add URL to monitor"

  endpoints_to_monitor:
    - "https://yourdomain.com"
    - "https://yourdomain.com/api/health"

  alert_channels:
    - "Telegram"
    - "Email"
    - "Slack (optional)"
```

### Error Tracking (Optional)

```bash
# Sentry setup
npm install @sentry/nextjs

# Run setup wizard
npx @sentry/wizard -i nextjs
```

---

## POST-DEPLOYMENT CHECKLIST

```yaml
immediate_after_deploy:
  - [ ] All pages load without errors
  - [ ] Auth flow works (sign up, sign in, sign out)
  - [ ] API endpoints respond correctly
  - [ ] Database operations work
  - [ ] Webhooks configured and tested

within_24_hours:
  - [ ] Set up uptime monitoring
  - [ ] Verify PostHog receiving events
  - [ ] Test payment flow end-to-end
  - [ ] Check error logs (Vercel)
  - [ ] Run Lighthouse audit

within_1_week:
  - [ ] Set up automated backups
  - [ ] Document all credentials securely
  - [ ] Create runbook for common issues
  - [ ] Set up alerts for anomalies
  - [ ] Review security headers
```

---

## HANDOFF TO MARKETING

### Deployment Complete Document

```markdown
# Deployment Complete: {APP_NAME}

## URLs
- Production: https://yourdomain.com
- Preview: https://preview-yourdomain.vercel.app
- API Health: https://yourdomain.com/api/health

## Status
- Deployment: SUCCESS
- SSL: ACTIVE
- Database: CONNECTED
- Webhooks: CONFIGURED
- Monitoring: ENABLED

## Key Pages for Marketing
- Landing: https://yourdomain.com
- Pricing: https://yourdomain.com/pricing
- Sign Up: https://yourdomain.com/sign-up
- Features: https://yourdomain.com/features

## Technical Details
- Hosting: Vercel (iad1 region)
- Database: Neon PostgreSQL
- Auth: Clerk
- Payments: Stripe
- Analytics: PostHog

## Next Steps
1. Run marketing workflow: `/factory:market {APP_NAME}`
2. Create launch announcement
3. Set up social media
4. Prepare ProductHunt launch

---
Deployed: {timestamp}
Ready for marketing: YES
```

---

## COMMANDS

| Command | Description |
|---------|-------------|
| `/factory:deploy` | Start deployment workflow |
| `/factory:deploy:status` | Check deployment status |
| `/factory:deploy:rollback` | Rollback to previous version |
| `/factory:deploy:env` | Manage environment variables |
| `/factory:deploy:domain` | Configure custom domain |
| `/factory:deploy:ssl` | Check SSL status |

---

## TROUBLESHOOTING

### Common Issues

```yaml
issues:
  build_fails:
    symptoms: "Vercel build fails"
    causes:
      - "Missing environment variables"
      - "TypeScript errors"
      - "Dependency conflicts"
    fixes:
      - "Check Vercel logs for specific error"
      - "Run `npm run build` locally"
      - "Verify all env vars are set in Vercel"

  database_connection:
    symptoms: "Cannot connect to database"
    causes:
      - "Wrong DATABASE_URL"
      - "IP not allowlisted"
      - "SSL mode incorrect"
    fixes:
      - "Verify connection string format"
      - "Check database provider's IP allowlist"
      - "Ensure ?sslmode=require in URL"

  webhooks_failing:
    symptoms: "Clerk/Stripe webhooks return 400/500"
    causes:
      - "Wrong webhook secret"
      - "Endpoint URL incorrect"
      - "Code error in webhook handler"
    fixes:
      - "Verify webhook secret matches"
      - "Check endpoint URL is correct"
      - "Review Vercel function logs"

  ssl_not_working:
    symptoms: "SSL certificate invalid"
    causes:
      - "DNS not propagated"
      - "Cloudflare SSL mode wrong"
      - "Domain not verified in Vercel"
    fixes:
      - "Wait for DNS propagation (up to 48h)"
      - "Set Cloudflare SSL to Full (strict)"
      - "Re-add domain in Vercel"

  slow_performance:
    symptoms: "Pages load slowly"
    causes:
      - "Large bundle size"
      - "Slow database queries"
      - "No caching"
    fixes:
      - "Analyze bundle: npm run analyze"
      - "Add database indexes"
      - "Implement caching headers"
```

---

*Deploy App Workflow v4.0 - From build to live in 30 minutes*
*Includes Vercel, Railway alternatives, Cloudflare DNS*
