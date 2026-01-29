# 2-Minute Setup (Everything FREE)

## Required (1 step - 30 seconds)

### ✅ Step 1: Get Gemini API Key (FREE)

1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copy the key
4. Paste in dashboard → Settings → Gemini API Key
5. Click Save

**That's it!** You can now build apps.

**Quota:** 1M tokens/day = ~2000 apps/day (FREE forever)

---

## Optional (For deployments - 1 minute)

### 🚀 Step 2: Get Vercel Token (OPTIONAL - for auto-deploy)

1. Go to: https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it: "App Factory"
4. Copy the token
5. Paste in dashboard → Settings → Vercel Token
6. Click Save

**Result:** One-click deployments to live URLs

**Quota:** Unlimited deployments (FREE tier)

---

## You're Done!

### What you can do NOW:

✅ Build unlimited apps (Gemini free tier)
✅ Deploy to Vercel (if token added)
✅ Generate landing + pricing + dashboard pages
✅ Stripe payment integration (add keys later)
✅ Track all costs in real-time

### What's optional (add later if needed):

⏸️ Stripe keys: For accepting payments
⏸️ PostHog: For analytics
⏸️ Authentication: Add Clerk/Auth.js when ready
⏸️ Database: Add when you need data persistence

---

## Quick Test

1. Go to dashboard
2. Type: "Build a simple task tracker app"
3. Click "Build App & Deploy"
4. Wait 30 seconds
5. Check `/generated-apps/buildasimple/`
6. Run: `cd generated-apps/buildasimple && npm run dev`
7. Open: http://localhost:3001

**Your app is ready!**

---

## Cost Breakdown (with FREE tiers)

| Service | Free Tier | What It Does | Required? |
|---------|-----------|--------------|-----------|
| **Gemini AI** | 1M tokens/day | Generates code | ✅ YES |
| **Vercel** | Unlimited | Hosts apps | 🟡 Recommended |
| Stripe | Free (2.9% fee) | Payments | ⏸️ When ready |
| PostHog | 1M events/month | Analytics | ⏸️ Optional |
| Clerk/Auth.js | 10k users | Authentication | ⏸️ Optional |

**Monthly cost with free tiers: $0**

---

## Troubleshooting

**"Setup required" error?**
→ Add Gemini API key (step 1 above)

**Build takes forever?**
→ First build: ~30 sec (installs dependencies)
→ Later builds: ~15 sec (cached)

**Want to deploy?**
→ Add Vercel token (step 2 above) OR deploy manually: `vercel --prod`

**Costs showing up?**
→ Only if you exceed free tiers (unlikely)
→ Gemini: 1M tokens/day = ~2000 apps/day
→ Vercel: Unlimited deployments

---

## That's It!

The system is designed to work 100% on FREE tiers. You can build and deploy unlimited apps for $0/month.

**Next:** Read QUICK_START.md for workflow details
