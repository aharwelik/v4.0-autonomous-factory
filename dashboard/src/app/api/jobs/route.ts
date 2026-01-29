import { NextRequest, NextResponse } from "next/server";
import { backgroundJobs } from "@/lib/db";

/**
 * GET /api/jobs - Get recent background jobs
 *
 * Query params:
 *   - limit: max jobs to return (default: 20)
 *   - status: filter by status (optional)
 *
 * Returns jobs mapped to "agent activity" format for dashboard display
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status");

    // Get recent jobs (both pending and completed)
    const pending = backgroundJobs.getPending();
    const allJobs = backgroundJobs.getAll ? backgroundJobs.getAll(limit) : pending;

    // Filter by status if specified
    let jobs = status
      ? allJobs.filter((j: { status: string }) => j.status === status)
      : allJobs;

    // Limit results
    jobs = jobs.slice(0, limit);

    // Map job types to "agent" names for display
    const agentMapping: Record<string, { name: string; icon: string }> = {
      build_app: { name: "Builder Agent", icon: "hammer" },
      validate: { name: "Validator Agent", icon: "check" },
      deploy: { name: "Deploy Agent", icon: "rocket" },
      discover: { name: "Research Agent", icon: "search" },
      content: { name: "Content Agent", icon: "file-text" },
    };

    // Transform jobs to agent activity format
    const activities = jobs.map((job: {
      id: string;
      type: string;
      status: string;
      created_at: string;
      started_at?: string;
      completed_at?: string;
      data?: string;
      payload?: string;
      error?: string;
    }) => {
      const agent = agentMapping[job.type] || { name: job.type, icon: "bot" };
      const data = job.data || job.payload;
      let parsedData = {};
      try {
        parsedData = data ? JSON.parse(data) : {};
      } catch {
        // ignore parse errors
      }

      return {
        id: job.id,
        agent: agent.name,
        icon: agent.icon,
        type: job.type,
        status: job.status,
        task: (parsedData as { idea?: string }).idea?.slice(0, 50) || job.type,
        startedAt: job.started_at || job.created_at,
        completedAt: job.completed_at,
        error: job.error,
      };
    });

    // Calculate stats
    const stats = {
      total: jobs.length,
      running: jobs.filter((j: { status: string }) => j.status === "running").length,
      queued: jobs.filter((j: { status: string }) => j.status === "queued").length,
      completed: jobs.filter((j: { status: string }) => j.status === "completed").length,
      failed: jobs.filter((j: { status: string }) => j.status === "failed").length,
    };

    return NextResponse.json({
      success: true,
      activities,
      stats,
    });
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch jobs",
      },
      { status: 500 }
    );
  }
}
