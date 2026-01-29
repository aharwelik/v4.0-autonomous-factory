import { NextRequest, NextResponse } from "next/server";
import {
  startBuildMonitor,
  stopBuildMonitor,
  getBuildMonitorStatus,
  triggerBuildMonitorCheck,
} from "@/services/build-monitor-service";

/**
 * GET /api/build-monitor
 * Get current status of build monitor
 */
export async function GET() {
  try {
    const status = getBuildMonitorStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/build-monitor
 * Control build monitor (start, stop, trigger)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "start":
        startBuildMonitor();
        return NextResponse.json({
          success: true,
          message: "Build monitor started",
        });

      case "stop":
        stopBuildMonitor();
        return NextResponse.json({
          success: true,
          message: "Build monitor stopped",
        });

      case "trigger":
        await triggerBuildMonitorCheck();
        return NextResponse.json({
          success: true,
          message: "Monitor check triggered",
        });

      case "status":
        const status = getBuildMonitorStatus();
        return NextResponse.json(status);

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: start, stop, trigger, or status" },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
