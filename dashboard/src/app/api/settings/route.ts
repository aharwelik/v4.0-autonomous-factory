import { NextRequest, NextResponse } from "next/server";
import { settings, cache } from "@/lib/db";

/**
 * Settings API
 * GET - Retrieve all settings including API keys
 * POST - Update settings or API keys
 */

// API keys that can be stored
const API_KEY_SETTINGS = [
  "GEMINI_API_KEY",
  "ANTHROPIC_API_KEY",
  "VERCEL_TOKEN",
  "CLERK_SECRET_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "DATABASE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "POSTHOG_API_KEY",
  "RESEND_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "OPENAI_API_KEY",
  "GROK_API_KEY",
  // Hostinger
  "HOSTINGER_FTP_HOST",
  "HOSTINGER_FTP_USER",
  "HOSTINGER_FTP_PASS",
  "HOSTINGER_GIT_URL",
  // Railway
  "RAILWAY_TOKEN",
];

// Regular settings
const REGULAR_SETTINGS = [
  "runInBackground",
  "cacheEnabled",
  "cacheTTL",
  "budgetMonthly",
  "budgetWarning",
  "budgetCritical",
  "parallelAgents",
  "autoValidate",
  "n8n_url",
  "n8n_api_key",
];

export async function GET() {
  const result: Record<string, unknown> = {
    // Regular settings with defaults
    runInBackground: settings.get<boolean>("runInBackground") ?? true,
    cacheEnabled: settings.get<boolean>("cacheEnabled") ?? true,
    cacheTTL: settings.get<number>("cacheTTL") ?? 3600,
    budgetMonthly: settings.get<number>("budgetMonthly") ?? 100,
    budgetWarning: settings.get<number>("budgetWarning") ?? 0.75,
    budgetCritical: settings.get<number>("budgetCritical") ?? 0.9,
    parallelAgents: settings.get<number>("parallelAgents") ?? 3,
    autoValidate: settings.get<boolean>("autoValidate") ?? true,
    n8n_url: settings.get<string>("n8n_url") ?? "",
    n8n_api_key: settings.get<string>("n8n_api_key") ?? "",
  };

  // Add API keys (if they exist)
  for (const key of API_KEY_SETTINGS) {
    const value = settings.get<string>(key);
    if (value) {
      result[key] = value;
    }
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const allAllowedSettings = [...REGULAR_SETTINGS, ...API_KEY_SETTINGS];
    const updated: Record<string, unknown> = {};

    for (const key of allAllowedSettings) {
      if (key in body) {
        const value = body[key];

        // Don't save empty values for API keys
        if (API_KEY_SETTINGS.includes(key) && (!value || value.trim() === "")) {
          continue;
        }

        settings.set(key, value);
        updated[key] = API_KEY_SETTINGS.includes(key) ? "***saved***" : value;
      }
    }

    // Clear cache if cache settings changed
    if ("cacheEnabled" in body && !body.cacheEnabled) {
      cache.clear();
    }

    // Clear dashboard cache to reflect new API key status
    cache.delete("dashboard_data");

    return NextResponse.json({
      success: true,
      updated,
      message: `Updated ${Object.keys(updated).length} setting(s)`,
    });
  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
