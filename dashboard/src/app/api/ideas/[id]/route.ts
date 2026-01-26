import { NextRequest, NextResponse } from "next/server";
import { ideas, cache } from "@/lib/db";

/**
 * Individual Idea API
 *
 * GET: Get single idea by ID
 * DELETE: Delete idea
 * PATCH: Update idea
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const idea = ideas.get(params.id);

  if (!idea) {
    return NextResponse.json(
      { success: false, error: "Idea not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    idea,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deleted = ideas.delete(params.id);

  if (!deleted) {
    return NextResponse.json(
      { success: false, error: "Idea not found" },
      { status: 404 }
    );
  }

  cache.delete("dashboard_data");

  return NextResponse.json({
    success: true,
    message: "Idea deleted",
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = ideas.update(params.id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Idea not found" },
        { status: 404 }
      );
    }

    cache.delete("dashboard_data");

    return NextResponse.json({
      success: true,
      idea: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
