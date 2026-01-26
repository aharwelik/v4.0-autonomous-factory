# 🎯 Quick Reference Card
## Tool Selection Decision Tree

Print this out and keep it next to your desk!

---

## WHEN TO USE WHAT

### 📝 CONTENT GENERATION

```
Need text content?
├── Twitter/X content → Grok 4 ($3.15/1M tokens)
├── Long-form (blog, email) → GLM-4.5 ($0.63/1M tokens)
├── Complex reasoning → Claude Sonnet ($3.15/1M tokens)
└── Simple tasks → Claude Haiku ($1/1M tokens)

Need images?
├── Marketing graphics → Gemini 3 Pro Image ($0.04-0.24/image)
├── Screenshots/mockups → Gemini Image
└── Bulk images → Gemini Batch API (50% off)

Need video?
└── Product demos → Gemini Veo 2 (~$0.50/5 sec)
```

### 🔨 BUILDING APPS

```
What do you need?
├── UI Components → Vercel v0 (free tier available)
├── Backend code → Claude Code
├── Database → Claude Code + Drizzle
├── Payments → Stripe (2.9% + $0.30)
└── Auth → Clerk (free tier: 10k users)
```

### 🌐 BROWSER AUTOMATION

```
Task type?
├── File operations → Claude Code (always)
├── Browser signup → Browser Use + CapSolver
├── OAuth flow → Browser Use
├── Research task → Browser Use or Manus
└── Complex multi-step → Manus (if available)
```

### 📊 ANALYTICS

```
What to track?
├── Product analytics → PostHog (1M free events/mo)
├── Web analytics → PostHog or Plausible
├── Revenue → Stripe Dashboard
└── Custom dashboard → PostHog + Airtable
```

---

## COST CHEAT SHEET

### Monthly Budget Tiers

| Tier | Budget | Best For |
|------|--------|----------|
| 💚 Bootstrap | $15-30 | Learning, side projects |
| 💙 Starter | $50-100 | First serious app |
| 💜 Growth | $100-200 | Multiple apps |

### Per-Task Costs

| Task | Cost | Notes |
|------|------|-------|
| Validate 1 idea | $0.50 | Research + AI analysis |
| Generate blog post | $0.02 | Using GLM-4.5 |
| Generate 10 tweets | $0.01 | Using Grok |
| Generate 5 images | $0.20 | Using Gemini |
| Solve 1 CAPTCHA | $0.002 | Using CapSolver |
| Build simple app | $2-5 | Full stack |
| Deploy to Vercel | $0 | Free tier |

---

## AGENT QUICK GUIDE

| Agent | Trigger Phrases | Model |
|-------|-----------------|-------|
| **Orchestrator** | "help me", "I want to" | Sonnet |
| **Researcher** | "find ideas", "validate", "competitors" | Haiku |
| **Builder** | "build", "create", "code", "deploy" | Sonnet |
| **Marketer** | "content", "post", "marketing" | Haiku/Grok |
| **Operator** | "revenue", "metrics", "analytics" | Haiku |

---

## COMMON COMMANDS

```bash
# Start Claude Code
claude

# Ask for help
claude "Help me build [your idea]"

# Check system health
./scripts/health-check.sh

# View costs
/cost

# Check agent status
/status

# Find opportunities
/find-opportunities

# Validate an idea
/validate "AI-powered [whatever]"
```

---

## TROUBLESHOOTING QUICK FIXES

| Problem | Quick Fix |
|---------|-----------|
| Claude not responding | Check ANTHROPIC_API_KEY |
| CAPTCHA failing | Top up CapSolver balance |
| Deployment failed | Run `vercel --force` |
| n8n not running | `docker start n8n` |
| High costs | Switch to Haiku/GLM |

---

## API KEY LOCATIONS

| Service | Where to Get Key |
|---------|------------------|
| Anthropic | console.anthropic.com |
| Gemini | ai.google.dev |
| Grok | x.ai |
| Vercel | vercel.com/account/tokens |
| Telegram | @BotFather on Telegram |
| CapSolver | capsolver.com/dashboard |
| Stripe | dashboard.stripe.com/apikeys |

---

## $10K MRR FORMULA

```
Target: $10,000/month

At $29/month pricing:
• Need: 345 customers
• Monthly signups needed: ~30 (assumes 10% churn)
• Trial conversion needed: 15%
• Visitors needed: 200/day (at 5% trial signup)

At $99/month pricing:
• Need: 101 customers
• Monthly signups needed: ~10
• Higher-touch sales okay at this price
```

---

## DAILY CHECKLIST

```
Morning:
☐ Check Telegram for overnight alerts
☐ Review new opportunities (Airtable)
☐ Check agent status (/status)
☐ Review content queue

Afternoon:
☐ Approve generated content
☐ Check build progress
☐ Review any errors

Evening:
☐ Check daily costs (/cost)
☐ Queue tomorrow's content
☐ Plan next day's priorities
```

---

*Quick Reference v4.0 - Keep this handy!*
