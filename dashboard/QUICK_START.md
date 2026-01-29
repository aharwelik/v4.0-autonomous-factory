# Quick Start Guide - Dashboard Navigation

## Dashboard Layout (Simple & Easy)

### 1. Top Section - Build Your App

**Location:** The big gradient area at the top

**What to do:**
1. Type your app idea in the text box
2. Click "Build App & Deploy"
3. Wait for validation (10-30 seconds)
4. App builds automatically in background

**Examples:**
- "Build a habit tracker app for daily goals"
- "Build a recipe organizer with meal planning"
- "Build a password manager for teams"

### 2. Build Progress

**Location:** Tabs at the bottom

**Tabs:**
- **Pipeline:** See all your ideas and apps
- **Agents:** Watch AI agents work in real-time
- **Apps:** View built apps and their stats
- **Content:** Marketing content calendar
- **Costs:** Track API spending

### 3. Cost Tracking

**Location:** Top right corner

Shows:
- Today's API costs (aim for < $0.50/day)
- Monthly costs (aim for < $10/month)

**What's FREE:**
- Gemini AI: 1M tokens/day
- Vercel hosting: Unlimited deploys
- Most features: No cost

### 4. Settings

**Location:** Click "Settings" button (top right)

**Important settings:**
- ✅ Gemini API Key: REQUIRED (free from Google)
- ✅ Vercel Token: For deployments (optional but recommended)
- ⏸️ Everything else: Optional

## Workflow (3 Simple Steps)

### Step 1: Enter Your Idea
```
Type: "Build a workout tracker for gym enthusiasts"
Click: "Build App & Deploy"
```

### Step 2: Wait for Build
- Validation: ~10 seconds
- Building: ~20 seconds
- Total: ~30 seconds

### Step 3: Deploy
Your app is in `/generated-apps/your-app-name/`

**Option A:** Deploy to Vercel (if token configured)
- Click "Deploy" button
- Live in 30 seconds

**Option B:** Run locally
```bash
cd generated-apps/your-app-name
npm install  # Already done during build!
npm run dev
```

## What Gets Generated

Every app includes:
- ✅ Landing page (AI-customized for your idea)
- ✅ Pricing page (ready for Stripe)
- ✅ Sign-up page (add auth later if needed)
- ✅ Dashboard (customize after generation)
- ✅ Stripe integration (add keys to enable)
- ✅ README with setup instructions

## Quota Usage (Optimized for FREE tier)

**What uses AI quota:**
- Landing page generation: ~500 tokens (~$0.02)

**What's FREE (no quota):**
- Pricing page: Template (0 tokens)
- Sign-up page: Template (0 tokens)
- Dashboard: Template (0 tokens)
- Stripe integration: Generated code (0 tokens)

**Result:** ~$0.02 per app with Gemini FREE tier

## Troubleshooting

**"Setup required" message?**
→ Add Gemini API key in Settings (free from https://aistudio.google.com/app/apikey)

**Build failed?**
→ Check the logs in "Agents" tab for details

**Want to deploy?**
→ Add Vercel token in Settings (free from https://vercel.com/account/tokens)

**Costs too high?**
→ You're using too many AI calls. Stick to 1 app per day with free tier.

## Pro Tips

1. **Keep it simple**: Describe ONE core feature clearly
2. **Be specific**: "habit tracker for daily goals" > "productivity app"
3. **Check examples**: Click example ideas to see the format
4. **Use templates**: Most pages are templates (fast, free, reliable)
5. **Deploy often**: Vercel deploys are unlimited and free

## Next Steps

1. Build your first app (use an example idea)
2. Deploy to Vercel to test
3. Customize the code in `/generated-apps/`
4. Add your Stripe keys to accept payments
5. Share your app!

**The whole system is designed to work with FREE tiers. You can build unlimited apps for $0/month.**
