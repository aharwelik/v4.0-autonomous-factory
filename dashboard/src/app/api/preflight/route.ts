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
  // OPTIONAL BUT RECOMMENDED: Deployment
  // ═══════════════════════════════════════════════════════════════════════════

  const vercelToken = settings.get<string>("VERCEL_TOKEN");
  const hostingerGit = settings.get<string>("HOSTINGER_GIT_URL");
  const hostingerFtp = settings.get<string>("HOSTINGER_FTP_HOST");
  const railwayToken = settings.get<string>("RAILWAY_TOKEN");

  const hasAnyDeploy = !!(vercelToken || hostingerGit || hostingerFtp || railwayToken);

  checks.push({
    name: "Vercel Token (FREE - Recommended)",
    key: "VERCEL_TOKEN",
    status: vercelToken ? "configured" : "optional",
    required: false,
    description: "Auto-deploy to Vercel. FREE unlimited deploys for hobby projects.",
    howToGet: "https://vercel.com/account/tokens",
    freeOption: true,
  });

  checks.push({
    name: "Hostinger Git/FTP",
    key: "HOSTINGER_GIT_URL",
    status: (hostingerGit || hostingerFtp) ? "configured" : "optional",
    required: false,
    description: "Deploy to your Hostinger hosting.",
    howToGet: "Hostinger hPanel → Websites → Git or FTP Accounts",
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

  if (!canBuild) {
    statusEmoji = "🔴";
    statusMessage = "SETUP REQUIRED: Add an AI API key to start building apps.";
  } else if (!canDeploy) {
    statusEmoji = "🟡";
    statusMessage = "READY TO BUILD! Add Vercel/Hostinger to auto-deploy.";
  } else {
    statusEmoji = "🟢";
    statusMessage = "FULLY CONFIGURED! Ready to build and deploy apps.";
  }

  return NextResponse.json({
    success: true,
    canBuild,
    canDeploy,
    status: {
      emoji: statusEmoji,
      message: statusMessage,
      level: canBuild ? (canDeploy ? "ready" : "partial") : "blocked",
    },
    summary: {
      configured: configured.length,
      missing: missing.length,
      optional: optional.length,
      total: checks.length,
    },
    checks,
    // Quick access to what's blocking
    blockers: missing.map(m => ({
      name: m.name,
      key: m.key,
      howToGet: m.howToGet,
      freeOption: m.freeOption,
    })),
    // Recommendations
    recommendations: [
      !geminiKey && { priority: 1, message: "Add Gemini API key (FREE!) - Required for AI", url: "https://aistudio.google.com/app/apikey" },
      !vercelToken && canBuild && { priority: 2, message: "Add Vercel token (FREE!) - Auto-deploy apps", url: "https://vercel.com/account/tokens" },
      !telegramToken && canBuild && { priority: 3, message: "Add Telegram bot (FREE!) - Get build notifications", url: "https://t.me/BotFather" },
    ].filter(Boolean),
  });
}
