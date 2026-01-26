# 🏭 Autonomous App Factory v4.0
## The Complete AI-Powered App Building System

**Purpose**: Build profitable micro-SaaS apps autonomously with Claude Code, browser automation, and multi-agent orchestration.

**Target**: $10k MRR per app within 6-12 months

**Philosophy**: You describe what you want → AI builds it → You watch it happen

---

## 🏗️ SYSTEM ARCHITECTURE (For Reverse Engineering)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         APP FACTORY v4.0 ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐     ┌─────────────────────────────────────────────────────┐   │
│  │   YOU       │────▶│              DASHBOARD (localhost:3000)             │   │
│  │ Type Idea   │     │  Next.js 14 + SQLite + Tailwind + shadcn/ui        │   │
│  └─────────────┘     │                                                     │   │
│                      │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐  │   │
│                      │  │ Idea    │ │ Setup   │ │Telegram │ │ Workflow │  │   │
│                      │  │Discovery│ │ Guide   │ │ Alerts  │ │ Manager  │  │   │
│                      │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬─────┘  │   │
│                      └───────┼──────────┼──────────┼──────────┼──────────┘   │
│                              │          │          │          │              │
│  ┌───────────────────────────┴──────────┴──────────┴──────────┴────────────┐ │
│  │                        API LAYER (Next.js Routes)                        │ │
│  │  /api/dashboard  /api/discover  /api/ideas  /api/telegram  /api/settings │ │
│  └───────────────────────────┬──────────────────────────────────────────────┘ │
│                              │                                                │
│  ┌───────────────────────────┴──────────────────────────────────────────────┐ │
│  │                      DATA LAYER (SQLite + Cache)                         │ │
│  │  /data/factory.db - ideas, apps, costs, settings, cache, background_jobs │ │
│  └───────────────────────────┬──────────────────────────────────────────────┘ │
│                              │                                                │
│  ┌───────────────────────────┴──────────────────────────────────────────────┐ │
│  │                    AI PROVIDER ABSTRACTION                               │ │
│  │  Gemini (FREE!) ─┬─▶ callAI() ─▶ Unified Response                       │ │
│  │  Claude         ─┤                                                       │ │
│  │  OpenAI         ─┤   /dashboard/src/lib/ai-provider.ts                  │ │
│  │  Grok           ─┘                                                       │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     n8n WORKFLOWS (localhost:5678)                       │   │
│  │                                                                          │   │
│  │  ┌────────────────────┐    ┌────────────────────────┐                   │   │
│  │  │ content-generation │    │ opportunity-discovery  │                   │   │
│  │  │  • Daily 8 AM      │    │  • Every 4 hours       │                   │   │
│  │  │  • AI content      │    │  • Reddit scraping     │                   │   │
│  │  │  • Auto-post       │    │  • Score & save        │                   │   │
│  │  └────────────────────┘    └────────────────────────┘                   │   │
│  │                                                                          │   │
│  │  /workflows/n8n-templates/*.json                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         AGENT SYSTEM                                     │   │
│  │                                                                          │   │
│  │  orchestrator.md ─┬─▶ researcher.md  (find opportunities)               │   │
│  │     (boss)        ├─▶ builder.md     (write code)                       │   │
│  │                   ├─▶ marketer.md    (create content)                   │   │
│  │                   └─▶ operator.md    (monitor & maintain)               │   │
│  │                                                                          │   │
│  │  /agents/*.md                                                           │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### ONE-COMMAND SETUP

```bash
# Clone and run setup - everything auto-installs
git clone https://github.com/aharwelik/v4.0-autonomous-factory.git
cd v4.0-autonomous-factory
chmod +x scripts/setup.sh && ./scripts/setup.sh

# After setup, start everything:
./start.sh

# Dashboard: http://localhost:3000
# n8n:       http://localhost:5678
```

### WHAT GETS AUTO-INSTALLED

| Component | What | Where |
|-----------|------|-------|
| **Node.js** | Runtime | Global |
| **Claude Code** | AI coding assistant | Global (`npm install -g`) |
| **n8n** | Workflow automation | Global (`npm install -g`) |
| **PM2** | Process manager | Global (`npm install -g`) |
| **Dashboard** | Next.js app | `./dashboard/` |
| **SQLite DB** | Local database | `./data/factory.db` |
| **Workflows** | n8n JSON templates | `./workflows/n8n-templates/` |

### KEY FILES TO UNDERSTAND

| File | Purpose | Read First? |
|------|---------|-------------|
| `CLAUDE.md` | This file - system blueprint | ✅ Yes |
| `scripts/setup.sh` | Auto-installs everything | ✅ Yes |
| `ecosystem.config.js` | PM2 config (starts services) | Optional |
| `dashboard/src/lib/db.ts` | SQLite schema & operations | If modifying DB |
| `dashboard/src/lib/ai-provider.ts` | AI API abstraction | If adding AI providers |
| `dashboard/src/app/page.tsx` | Main dashboard UI | If modifying UI |
| `agents/*.md` | Agent behavior definitions | If modifying agents |

### DATA FLOW

```
1. USER INPUT
   └─▶ Dashboard textarea "Build an app that..."

2. BUILD API (/api/build)
   └─▶ Validates idea with AI (Gemini FREE or configured provider)
   └─▶ Scores for $10k MRR potential
   └─▶ Queues background build job

3. BACKGROUND BUILD
   └─▶ AI generates app code
   └─▶ Saves to /generated-apps/

4. DEPLOY
   └─▶ Vercel API ─▶ Production URL
   └─▶ Or Hostinger/Railway/custom hosting

5. MONITOR
   └─▶ n8n workflows ─▶ Telegram alerts
```

### HOSTING OPTIONS

| Provider | Cost | Best For | Auto-Deploy? |
|----------|------|----------|--------------|
| **Vercel** | FREE tier | Next.js apps | ✅ Yes |
| **Railway** | $5/mo minimum | Full-stack apps | ✅ Yes |
| **Hostinger** | $3-12/mo | Traditional + Node.js | ✅ Yes (Git deploy) |
| **Fly.io** | FREE tier | Docker apps | ✅ Yes |
| **Netlify** | FREE tier | Static sites | ✅ Yes |

To add Hostinger support, add these to your `.env`:
```
HOSTINGER_FTP_HOST=your-domain.com
HOSTINGER_FTP_USER=your-username
HOSTINGER_FTP_PASS=your-password
```

---

## ✅ WHAT WORKS NOW

### ✅ FULLY WORKING
- Dashboard UI with idea input
- API key entry directly in UI (no .env editing needed!)
- Gemini FREE API integration for validation
- SQLite database for persistence
- Reddit idea discovery (no API needed)
- Telegram notifications
- Setup wizard with clickable signup links
- n8n workflow auto-import via API
- **Full background build automation** - AI generates entire apps!
- **Visual build progress** - See each step as it happens
- **AI image generation** - Gemini creates preview images
- **Deploy to Vercel** - One-click deployment
- **Deploy to Hostinger** - Git or FTP deploy
- **Deploy to Railway** - Full-stack apps

### 🚧 COMING SOON
- Stripe payment integration
- PostHog analytics auto-setup
- More app templates

---

## 🎯 WHAT THIS SYSTEM DOES

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS APP FACTORY                       │
├─────────────────────────────────────────────────────────────────┤
│  1. DISCOVER: AI finds profitable app ideas automatically       │
│  2. VALIDATE: $10k feasibility check (no building bad ideas)   │
│  3. BUILD: Claude Code builds the entire app autonomously       │
│  4. DEPLOY: One-click deploy to Vercel/Railway/Fly.io          │
│  5. MARKET: AI creates content, posts, monitors engagement      │
│  6. ITERATE: Agents update, fix bugs, respond to feedback       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 TOOLS & WHEN TO USE EACH

### BUILD PHASE TOOLS

| Tool | When to Use | What It Does |
|------|-------------|--------------|
| **Claude Code** | Always first choice | Writes code, manages files, runs commands |
| **Vercel v0** | UI/Frontend generation | Creates React components from descriptions |
| **Browser Use** | Account signups, web tasks | Automates any browser action |
| **Manus** | Complex research, async tasks | Runs in background while you sleep |
| **n8n** | Automations, scheduling | Connects everything together |

### CONTENT GENERATION TOOLS

| Tool | When to Use | Cost |
|------|-------------|------|
| **Gemini 3 Pro Image** | Product screenshots, marketing images | $0.039/image |
| **Gemini Veo** | Product demo videos | $0.50/5-sec video |
| **Grok 4** | Real-time data, Twitter content | $3.15/1M input tokens |
| **GLM-4.5** | Budget content generation | $0.63/1M input tokens |

### MONITORING TOOLS

| Tool | Purpose | Cost |
|------|---------|------|
| **PostHog** | Analytics, session replay, A/B tests | Free tier: 1M events/mo |
| **Airtable** | Database, opportunity tracking | Free tier: 1,200 records |
| **Stripe** | Payments, revenue tracking | 2.9% + $0.30 per transaction |
| **Telegram** | Alerts, notifications | Free |

---

## 🚀 QUICK START

### Step 1: One-Command Setup

```bash
# Clone the repo
git clone https://github.com/aharwelik/v4.0-autonomous-factory.git
cd v4.0-autonomous-factory

# Run setup (installs EVERYTHING automatically)
chmod +x scripts/setup.sh && ./scripts/setup.sh
```

This auto-installs:
- Node.js (if missing)
- Claude Code
- n8n (workflow automation)
- PM2 (process manager)
- All project dependencies

### Step 2: Add API Keys (5 minutes)

Edit `.env` and add your keys. **Most are FREE!**

| Service | Free Tier | Get Key At |
|---------|-----------|------------|
| **Gemini** | 1M tokens/day FREE | https://aistudio.google.com/app/apikey |
| **Vercel** | Unlimited deploys | https://vercel.com/account/tokens |
| **Clerk** | 10,000 users | https://dashboard.clerk.com |
| **Neon** | 512MB PostgreSQL | https://console.neon.tech |
| **Telegram** | Unlimited | https://t.me/BotFather |
| **PostHog** | 1M events/month | https://app.posthog.com |

### Step 3: Start the Factory

```bash
# Create a folder for your apps
mkdir my-app-factory
cd my-app-factory

# Initialize the factory
claude "Read /path/to/CLAUDE.md and set up the app factory"
```

### Step 4: Tell Claude What to Build

Just talk to it like a person:

```
"I want to build an app that helps people track their water intake. 
It should have a simple interface where you tap to log water, 
see your daily progress, and get reminders."
```

Claude will:
1. Ask you clarifying questions
2. Check if it can make $10k/month
3. Build the app
4. Deploy it
5. Set up marketing automation

---

## 📋 QUESTIONS CLAUDE CODE WILL ASK YOU

When you start a new app project, Claude Code will ask these questions to understand exactly what to build:

### Understanding Your Idea (5-10 questions)

1. **"In one sentence, what problem does this app solve?"**
   - Good: "Helps freelancers track time and invoice clients"
   - Bad: "It's like a better version of everything"

2. **"Who exactly would pay for this? Be specific."**
   - Good: "Freelance graphic designers making $50k-100k/year"
   - Bad: "Everyone who needs it"

3. **"How much would they pay per month?"**
   - Claude will suggest: $9, $19, $29, $49, $99
   - Pick one. If unsure, Claude suggests based on research.

4. **"What's the ONE thing this app must do perfectly?"**
   - Focus. What's the killer feature?
   - Everything else is nice-to-have.

5. **"What existing tools are people using today?"**
   - This helps Claude research competitors
   - Example: "They use spreadsheets and Toggl"

6. **"Do you have any design preferences?"**
   - Dark mode? Light mode? Colors?
   - Claude will use v0 to generate options

### Technical Questions (if needed)

7. **"Do users need to log in?"**
   - Yes = needs database, auth
   - No = simpler, faster to build

8. **"Does it need to work on phones?"**
   - Mobile-first = Progressive Web App
   - Desktop only = simpler

9. **"Any integrations needed?"**
   - Stripe, Google Calendar, Slack, etc.

10. **"Where do you want it hosted?"**
    - Vercel (recommended, free tier)
    - Railway ($5/mo minimum)
    - Your own server

---

## 🤖 AGENT ARCHITECTURE

```
┌────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                          │
│    (The Boss - Decides What Happens When)                      │
└────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  RESEARCHER  │    │   BUILDER    │    │  MARKETER    │
│    AGENT     │    │    AGENT     │    │    AGENT     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Sub-agents:  │    │ Sub-agents:  │    │ Sub-agents:  │
│ - Reddit     │    │ - Frontend   │    │ - Content    │
│ - Trends     │    │ - Backend    │    │ - Social     │
│ - Reviews    │    │ - Database   │    │ - SEO        │
│ - Competitor │    │ - Deploy     │    │ - Outreach   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### How It Works

1. **Orchestrator** receives your request
2. Breaks it into tasks
3. Assigns to appropriate agent
4. Agents spawn sub-agents as needed
5. Sub-agents report back
6. Orchestrator compiles results
7. You see progress in real-time

---

## 🌐 SIGNUP AUTOMATION & HURDLE HANDLING

### Common Signup Hurdles & Solutions

| Hurdle | Solution | Tool |
|--------|----------|------|
| **CAPTCHA** | CapSolver API ($2/1000 solves) | Browser Use + CapSolver |
| **Email verification** | Use Mailinator or own domain | Browser Use |
| **Phone verification** | SMS-PVA service ($0.10/number) | Browser Use |
| **Manual approval** | Fallback to Manus async | Manus |
| **OAuth only** | GitHub/Google OAuth flow | Browser Use |
| **Rate limiting** | Rotating proxies + delays | Browser Use config |

### Signup Strategy Per Service

```yaml
# Vercel Signup (Easy - OAuth)
vercel:
  method: "github_oauth"
  steps:
    - Click "Continue with GitHub"
    - Authorize
    - Done
  captcha: none
  time: 30 seconds

# Stripe Setup (Medium - Verification)
stripe:
  method: "email_signup"
  steps:
    - Enter email
    - Verify email
    - Enter business details
    - Connect bank (manual step)
  captcha: none
  verification: email + identity
  time: 10 minutes + manual

# Reddit Account (Hard - Aggressive anti-bot)
reddit:
  method: "email_signup"
  steps:
    - Enter email
    - Solve CAPTCHA (always)
    - Wait 48h before posting (shadowban prevention)
  captcha: always
  tool: capsolver
  time: 2 minutes + 48h wait

# ProductHunt (Hard - Manual approval)
producthunt:
  method: "twitter_oauth"
  steps:
    - Connect Twitter
    - Wait for account review (24-72h)
    - Start engaging before posting
  captcha: none
  manual_step: true
  time: 5 minutes + 24-72h wait
```

### CAPTCHA Solving Setup

```javascript
// capsolver.config.js - For Browser Use integration
module.exports = {
  apiKey: process.env.CAPSOLVER_API_KEY,
  
  // Supported CAPTCHA types
  supported: [
    'recaptcha_v2',
    'recaptcha_v3', 
    'hcaptcha',
    'cloudflare_turnstile',
    'geetest'
  ],
  
  // Cost per solve (approximate)
  costs: {
    recaptcha_v2: 0.002,
    recaptcha_v3: 0.003,
    hcaptcha: 0.001,
    cloudflare_turnstile: 0.002
  },
  
  // Strategy
  strategy: {
    // Try stealth first (free)
    firstTry: 'stealth',
    // Fall back to solving if stealth fails
    fallback: 'solve',
    // Max retries before alerting human
    maxRetries: 3
  }
}
```

---

## 💰 COST TRACKING & BUDGETS

### Monthly Budget Breakdown

```
┌─────────────────────────────────────────────────────────┐
│  TIER 1: BOOTSTRAP ($15-30/month)                       │
├─────────────────────────────────────────────────────────┤
│  n8n self-hosted                         $0             │
│  Claude API (careful usage)              $5-10          │
│  Gemini (free tier)                      $0             │
│  Vercel (free tier)                      $0             │
│  Airtable (free tier)                    $0             │
│  PostHog (free tier)                     $0             │
│  CapSolver (500 solves)                  $1             │
│  Telegram                                $0             │
│  Domain                                  $10/year       │
│                                                         │
│  TOTAL: ~$20/month                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  TIER 2: COMFORTABLE ($50-100/month)                    │
├─────────────────────────────────────────────────────────┤
│  n8n Cloud                               $20            │
│  Claude API                              $20            │
│  Gemini                                  $10            │
│  Vercel Pro                              $20            │
│  Airtable Plus                           $20            │
│  CapSolver (2000 solves)                 $4             │
│  Browser Use hosted                      $30            │
│                                                         │
│  TOTAL: ~$120/month                                     │
└─────────────────────────────────────────────────────────┘
```

### Real-time Cost Monitoring

The dashboard tracks:
- API calls per provider
- Token usage
- CAPTCHA solves
- Hosting bandwidth
- Daily/weekly/monthly totals
- Projected monthly spend
- Budget alerts (75%, 90%, 100%)

---

## 📊 DASHBOARD OVERVIEW

The dashboard shows you everything in one place:

### Tab 1: Pipeline Health
- Ideas discovered this week
- Ideas in validation
- Apps being built
- Apps deployed
- Revenue by app

### Tab 2: Agent Activity (Real-time)
- What each agent is doing RIGHT NOW
- Recent actions (last 24h)
- Errors and retries
- Cost per agent

### Tab 3: App Performance
- Per-app analytics
- User signups
- Conversion rates
- Revenue metrics
- Session replays

### Tab 4: Content Calendar
- Scheduled posts
- Generated content queue
- Engagement metrics
- Platform breakdown

### Tab 5: Cost Center
- API usage graphs
- Cost by service
- Budget vs actual
- Alerts and warnings

---

## 🛠️ TROUBLESHOOTING

### Common Issues & Fixes

**"Claude Code won't start"**
```bash
# Check Node.js version (need 18+)
node --version

# Reinstall Claude Code
npm uninstall -g @anthropic-ai/claude-code
npm install -g @anthropic-ai/claude-code

# Set API key
export ANTHROPIC_API_KEY="your-key-here"
```

**"Browser Use keeps getting blocked"**
```bash
# Update stealth settings
cd browser-use
npm run configure-stealth

# Add proxy rotation
# Edit .env:
PROXY_ENABLED=true
PROXY_PROVIDER=brightdata  # or smartproxy
```

**"CAPTCHA solving not working"**
```bash
# Check CapSolver balance
curl https://api.capsolver.com/getBalance \
  -H "Content-Type: application/json" \
  -d '{"clientKey":"YOUR_KEY"}'

# Top up if needed at capsolver.com
```

**"Agent stuck in loop"**
```bash
# Check agent state
cat .gsd/STATE.md

# Reset specific agent
/gsd:reset-agent researcher

# Nuclear option: reset everything
/gsd:reset-all
```

---

## 📁 FILE STRUCTURE

```
v4.0-autonomous-factory/
├── CLAUDE.md                    # ← YOU ARE HERE
├── agents/
│   ├── orchestrator.md          # Master coordinator
│   ├── researcher.md            # Finds opportunities
│   ├── builder.md               # Builds apps
│   ├── marketer.md              # Creates & posts content
│   └── operator.md              # Monitors revenue
├── skills/
│   ├── browser-automation/      # Browser Use integration
│   ├── captcha-solving/         # CAPTCHA bypass
│   ├── ui-generation/           # Vercel v0 integration
│   ├── content-generation/      # Gemini/Grok/GLM
│   └── analytics/               # PostHog integration
├── workflows/
│   ├── build-app.md             # Full app build process
│   ├── deploy-app.md            # Deployment automation
│   ├── market-app.md            # Marketing automation
│   └── n8n-templates/           # Import-ready workflows
├── dashboard/
│   ├── index.html               # Main dashboard
│   ├── components/              # React components
│   └── api/                     # Dashboard API
├── templates/
│   ├── app-templates/           # Starter code templates
│   ├── landing-pages/           # Marketing templates
│   └── email-sequences/         # Email automation
├── config/
│   ├── api-keys.env.template    # API key template
│   ├── budget-limits.json       # Cost controls
│   └── agent-settings.json      # Agent configuration
├── docs/
│   ├── SETUP-GUIDE.md           # Detailed setup
│   ├── TROUBLESHOOTING.md       # Fix common issues
│   └── API-REFERENCE.md         # All API docs
└── scripts/
    ├── setup.sh                 # One-click setup
    ├── health-check.sh          # System diagnostics
    └── backup.sh                # Data backup
```

---

## ⚠️ HONEST ASSESSMENT

### What This System CAN Do
✅ Automate 80% of app building process
✅ Find and validate app ideas automatically
✅ Generate UI with v0 and ship to production
✅ Handle routine marketing tasks
✅ Monitor and alert on key metrics
✅ Scale to multiple apps simultaneously

### What This System CANNOT Do
❌ Replace human judgment on business decisions
❌ Guarantee any app will succeed
❌ Bypass services that truly require human verification
❌ Create genuinely viral content (can create content, virality is luck)
❌ Handle complex legal/compliance issues
❌ Make you rich overnight

### Where You'll Still Need Human Input
⚡ Final approval on app concepts
⚡ Bank/payment verification (legal requirement)
⚡ Responding to customer edge cases
⚡ Strategic pivots when something isn't working
⚡ Creative direction for brand voice

---

## 🎓 NEXT STEPS

1. **Read**: `/docs/SETUP-GUIDE.md` for detailed setup
2. **Run**: `/scripts/setup.sh` to configure everything
3. **Test**: Try building a simple app first
4. **Scale**: Add more apps as you learn the system

**Questions?** The system itself can answer most questions. Just ask Claude Code:

```
"Explain how the researcher agent works"
"Show me how to add a new marketing channel"
"Why did my last build fail?"
```

---

*Built with 💀 brutal honesty by the App Factory Team*
*Version 4.0 - January 2026*
