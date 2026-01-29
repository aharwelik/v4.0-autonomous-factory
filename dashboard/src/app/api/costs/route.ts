import { NextRequest, NextResponse } from "next/server";
import { costs } from "@/lib/db";

/**
 * GET /api/costs - Get cost summary and breakdown
 *
 * Query params:
 *   - days: number of days for byService breakdown (default: 30)
 *
 * Returns:
 *   - today: total cost today
 *   - month: total cost this month
 *   - byService: breakdown by provider for last N days
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const today = costs.today();
    const month = costs.thisMonth();
    const byService = costs.byService(days);

    return NextResponse.json({
      success: true,
      today,
      month,
      byService,
      // Also include formatted versions for display
      formatted: {
        today: `$${today.toFixed(2)}`,
        month: `$${month.toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error("Failed to fetch costs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch costs"
      },
      { status: 500 }
    );
  }
}
