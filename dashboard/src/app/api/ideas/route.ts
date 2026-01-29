import { NextRequest, NextResponse } from "next/server";
import { ideas, backgroundJobs, cache } from "@/lib/db";
import { randomUUID } from "crypto";

/**
 * Ideas API
 * GET - List ideas
 * POST - Submit new idea
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50');

  const ideaList = ideas.list(status, limit);
  const stats = ideas.stats();

  return NextResponse.json({
    success: true,
    ideas: ideaList,
    stats,
    total: ideaList.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const id = `idea-${randomUUID().slice(0, 8)}`;

    // Create the idea
    const idea = ideas.create({
      id,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      source: body.source || 'dashboard',
      score: 0, // Will be calculated during validation
      status: 'new',
      auto_discovered: 0,
      signal_count: 0,
      search_growth: 0,
      competitor_count: 0,
    });

    // Create a background job for validation if enabled
    if (body.autoValidate !== false) {
      backgroundJobs.create({
        id: `job-${randomUUID().slice(0, 8)}`,
        type: 'validate_idea',
        payload: { ideaId: id },
        priority: 10,
        runInBackground: body.runInBackground ?? true,
      });
    }

    // Clear dashboard cache
    cache.delete('dashboard_data');

    return NextResponse.json({
      success: true,
      idea,
      message: 'Idea submitted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
