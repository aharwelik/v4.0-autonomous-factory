import { NextRequest, NextResponse } from "next/server";
import { settings, cache } from "@/lib/db";

/**
 * Settings API
 * GET - Retrieve all settings
 * POST - Update settings
 */

export async function GET() {
  return NextResponse.json({
    runInBackground: settings.get<boolean>('runInBackground') ?? true,
    cacheEnabled: settings.get<boolean>('cacheEnabled') ?? true,
    cacheTTL: settings.get<number>('cacheTTL') ?? 3600,
    budgetMonthly: settings.get<number>('budgetMonthly') ?? 100,
    budgetWarning: settings.get<number>('budgetWarning') ?? 0.75,
    budgetCritical: settings.get<number>('budgetCritical') ?? 0.90,
    parallelAgents: settings.get<number>('parallelAgents') ?? 3,
    autoValidate: settings.get<boolean>('autoValidate') ?? true,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate and update each setting
    const allowedSettings = [
      'runInBackground',
      'cacheEnabled',
      'cacheTTL',
      'budgetMonthly',
      'budgetWarning',
      'budgetCritical',
      'parallelAgents',
      'autoValidate',
    ];

    const updated: Record<string, unknown> = {};

    for (const key of allowedSettings) {
      if (key in body) {
        settings.set(key, body[key]);
        updated[key] = body[key];
      }
    }

    // Clear cache if cache settings changed
    if ('cacheEnabled' in body && !body.cacheEnabled) {
      cache.clear();
    }

    return NextResponse.json({
      success: true,
      updated,
      message: `Updated ${Object.keys(updated).length} setting(s)`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
