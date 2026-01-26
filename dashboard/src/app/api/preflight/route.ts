import { NextResponse } from "next/server";
import { settings } from "@/lib/db";

/**
 * PREFLIGHT CHECK API
 *
 * Checks everything needed BEFORE user submits an idea.
 * Returns clear list of:
 * - What's configured ✅
 * - What's missing ❌
 * - What's optional ⚪
 */

interface CheckResult {
  name: string;
  key: string;
  status: "configured" | "missing" | "optional";
  required: boolean;
  description: string;
  howToGet: string;
  freeOption?: boolean;
}

export async function GET() {
  const checks: CheckResult[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUIRED: At least ONE AI provider
  // ═══════════════════════════════════════════════════════════════════════════

  const geminiKey = settings.get<string>("GEMINI_API_KEY");
  const anthropicKey = settings.get<string>("ANTHROPIC_API_KEY");
  const openaiKey = settings.get<string>("OPENAI_API_KEY");
  const grokKey = settings.get<string>("GROK_API_KEY");

  const hasAnyAI = !!(geminiKey || anthropicKey || openaiKey || grokKey);

  checks.push({
    name: "Gemini API (FREE - Recommended)",
    key: "GEMINI_API_KEY",
    status: geminiKey ? "configured" : (hasAnyAI ? "optional" : "missing"),
    required: !hasAnyAI,
    description: "FREE AI for validation and code generation. 1M tokens/day free!",
    howToGet: "https://aistudio.google.com/app/apikey",
    freeOption: true,
  });

  checks.push({
    name: "Anthropic Claude API",
    key: "ANTHROPIC_API_KEY",
    status: anthropicKey ? "configured" : "optional",
    required: false,
    description: "Premium AI for complex builds. $5 free credit for new accounts.",
    howToGet: "https://console.anthropic.com/settings/keys",
  });

  checks.push({
    name: "OpenAI API",
    key: "OPENAI_API_KEY",
    status: openaiKey ? "configured" : "optional",
    required: false,
    description: "Alternative AI provider.",
    howToGet: "https://platform.openai.com/api-keys",
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUIRED: At least ONE deployment option
  // ═══════════════════════════════════════════════════════════════════════════

  const vercelToken = settings.get<string>("VERCEL_TOKEN");
  const hostingerGit = settings.get<string>("HOSTINGER_GIT_URL");
  const hostingerFtp = settings.get<string>("HOSTINGER_FTP_HOST");
  const railwayToken = settings.get<string>("RAILWAY_TOKEN");

  const hasAnyDeploy = !!(vercelToken || hostingerGit || hostingerFtp || railwayToken);

  // At least one deploy option is REQUIRED to publish your app
  checks.push({
    name: "Vercel Token (FREE - Recommended)",
    key: "VERCEL_TOKEN",
    status: vercelToken ? "configured" : (hasAnyDeploy ? "optional" : "missing"),
    required: !hasAnyDeploy, // Required if no other deploy option
    description: "Auto-deploy to Vercel. FREE unlimited deploys for hobby projects.",
    howToGet: "https://vercel.com/account/tokens",
    freeOption: true,
  });

  checks.push({
    name: "Hostinger Git/FTP",
    key: "HOSTINGER_GIT_URL",
    status: (hostingerGit || hostingerFtp) ? "configured" : (hasAnyDeploy ? "optional" : "missing"),
    required: !hasAnyDeploy, // Required if no other deploy option
    description: "Deploy to your Hostinger hosting. Use if you have Hostinger account.",
    howToGet: "Hostinger hPanel → Websites → Git or FTP Accounts",
  });

  checks.push({
    name: "Railway Token",
    key: "RAILWAY_TOKEN",
    status: railwayToken ? "configured" : (hasAnyDeploy ? "optional" : "missing"),
    required: !hasAnyDeploy, // Required if no other deploy option
    description: "Deploy full-stack apps. $5/mo minimum after free trial.",
    howToGet: "https://railway.app/account/tokens",
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIONAL: Notifications
  // ═══════════════════════════════════════════════════════════════════════════

  const telegramToken = settings.get<string>("TELEGRAM_BOT_TOKEN");
  const telegramChat = settings.get<string>("TELEGRAM_CHAT_ID");

  checks.push({
    name: "Telegram Notifications (FREE)",
    key: "TELEGRAM_BOT_TOKEN",
    status: (telegramToken && telegramChat) ? "configured" : "optional",
    required: false,
    description: "Get notified when builds complete. FREE and instant.",
    howToGet: "https://t.me/BotFather → /newbot",
    freeOption: true,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // OPTIONAL: Future features
  // ═══════════════════════════════════════════════════════════════════════════

  const stripeKey = settings.get<string>("STRIPE_SECRET_KEY");
  checks.push({
    name: "Stripe Payments",
    key: "STRIPE_SECRET_KEY",
    status: stripeKey ? "configured" : "optional",
    required: false,
    description: "Accept payments in your apps. Only pay per transaction.",
    howToGet: "https://dashboard.stripe.com/apikeys",
  });

  const posthogKey = settings.get<string>("POSTHOG_API_KEY");
  checks.push({
    name: "PostHog Analytics (FREE tier)",
    key: "POSTHOG_API_KEY",
    status: posthogKey ? "configured" : "optional",
    required: false,
    description: "Track users, session replays, A/B tests. 1M events/month free.",
    howToGet: "https://app.posthog.com",
    freeOption: true,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  const configured = checks.filter(c => c.status === "configured");
  const missing = checks.filter(c => c.status === "missing");
  const optional = checks.filter(c => c.status === "optional");

  const canBuild = hasAnyAI;
  const canDeploy = hasAnyDeploy;

  // Build detailed status message
  let statusMessage = "";
  let statusEmoji = "";

  if (!canBuild && !canDeploy) {
    statusEmoji = "🔴";
    statusMessage = "SETUP REQUIRED: Add AI key + hosting to build and publish apps.";
  } else if (!canBuild) {
    statusEmoji = "🔴";
    statusMessage = "SETUP REQUIRED: Add an AI API key (Gemini is FREE!) to build apps.";
  } else if (!canDeploy) {
    statusEmoji = "🟡";
    statusMessage = "ADD HOSTING: You can build but need Vercel/Hostinger/Railway to publish.";
  } else {
    statusEmoji = "🟢";
    statusMessage = "FULLY CONFIGURED! Ready to build and deploy apps.";
  }

  // Group blockers by category for clearer UI
  const aiBlockers = missing.filter(m => ["GEMINI_API_KEY", "ANTHROPIC_API_KEY", "OPENAI_API_KEY"].includes(m.key));
  const deployBlockers = missing.filter(m => ["VERCEL_TOKEN", "HOSTINGER_GIT_URL", "RAILWAY_TOKEN"].includes(m.key));

  return NextResponse.json({
    success: true,
    canBuild,
    canDeploy,
    status: {
      emoji: statusEmoji,
      message: statusMessage,
      level: canBuild && canDeploy ? "ready" : (canBuild ? "partial" : "blocked"),
    },
    summary: {
      configured: configured.length,
      missing: missing.length,
      optional: optional.length,
      total: checks.length,
    },
    checks,
    // Quick access to what's blocking - grouped by type
    blockers: missing.map(m => ({
      name: m.name,
      key: m.key,
      howToGet: m.howToGet,
      freeOption: m.freeOption,
      category: ["GEMINI_API_KEY", "ANTHROPIC_API_KEY", "OPENAI_API_KEY"].includes(m.key) ? "ai" : "deploy",
    })),
    // Specific missing categories
    missingAI: !hasAnyAI,
    missingDeploy: !hasAnyDeploy,
    // AI options (pick one)
    aiOptions: !hasAnyAI ? [
      { name: "Gemini (FREE!)", key: "GEMINI_API_KEY", url: "https://aistudio.google.com/app/apikey", free: true, recommended: true },
      { name: "Anthropic Claude", key: "ANTHROPIC_API_KEY", url: "https://console.anthropic.com/settings/keys", free: false },
      { name: "OpenAI", key: "OPENAI_API_KEY", url: "https://platform.openai.com/api-keys", free: false },
    ] : null,
    // Deploy options (pick one)
    deployOptions: !hasAnyDeploy ? [
      { name: "Vercel (FREE!)", key: "VERCEL_TOKEN", url: "https://vercel.com/account/tokens", free: true, recommended: true },
      { name: "Hostinger", key: "HOSTINGER_GIT_URL", url: "https://hpanel.hostinger.com", free: false },
      { name: "Railway", key: "RAILWAY_TOKEN", url: "https://railway.app/account/tokens", free: false },
    ] : null,
    // Recommendations
    recommendations: [
      !geminiKey && !hasAnyAI && { priority: 1, message: "Add Gemini API key (FREE!) - Required for AI", url: "https://aistudio.google.com/app/apikey" },
      !vercelToken && !hasAnyDeploy && { priority: 2, message: "Add Vercel token (FREE!) or Hostinger - Required to publish", url: "https://vercel.com/account/tokens" },
      !telegramToken && canBuild && canDeploy && { priority: 3, message: "Add Telegram bot (FREE!) - Get build notifications", url: "https://t.me/BotFather" },
    ].filter(Boolean),
  });
}
