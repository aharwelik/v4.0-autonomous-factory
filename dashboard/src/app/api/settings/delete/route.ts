import { NextRequest, NextResponse } from "next/server";
import { settings, cache } from "@/lib/db";

/**
 * Delete a setting/API key
 */
export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json(
        { success: false, error: "Key is required" },
        { status: 400 }
      );
    }

    // Delete the setting
    settings.delete(key);

    // Clear dashboard cache
    cache.delete("dashboard_data");

    return NextResponse.json({
      success: true,
      message: `Deleted ${key}`,
    });
  } catch (error) {
    console.error("Delete setting error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete setting" },
      { status: 500 }
    );
  }
}
