import { NextRequest, NextResponse } from 'next/server';
import discoveryService from '@/services/discovery-service';
import { ideas, opportunitySignals } from '@/lib/db';

/**
 * Auto-Discovery API
 * GET - Get discovery service status
 * POST - Trigger manual discovery scan
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'status') {
    // Get service status
    const status = discoveryService.status();

    return NextResponse.json({
      success: true,
      status,
    });
  }

  if (action === 'ideas') {
    // Get auto-discovered ideas
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get all auto-discovered ideas
    const autoIdeas = ideas
      .list(undefined, 200)
      .filter((idea) => idea.auto_discovered === 1)
      .slice(0, limit);

    // Enrich with signal data
    const enrichedIdeas = autoIdeas.map((idea) => {
      const signals = opportunitySignals.listByIdea(idea.id, 10);

      return {
        ...idea,
        signals: signals.map((s) => ({
          type: s.signal_type,
          source: s.source,
          score: s.score,
          sentiment: s.sentiment,
          created_at: s.created_at,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      ideas: enrichedIdeas,
      total: enrichedIdeas.length,
    });
  }

  // Default: return summary
  const status = discoveryService.status();
  const autoIdeas = ideas
    .list(undefined, 100)
    .filter((idea) => idea.auto_discovered === 1);

  return NextResponse.json({
    success: true,
    summary: {
      serviceEnabled: status.isEnabled,
      serviceRunning: status.isRunning,
      lastRun: status.lastRun,
      lastResult: status.lastResult,
      nextRun: status.nextRun,
      autoDiscoveredCount: autoIdeas.length,
      topIdeas: autoIdeas
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((i) => ({
          id: i.id,
          title: i.title,
          score: i.score,
          signal_count: i.signal_count,
          source: i.source,
        })),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'trigger') {
      // Trigger manual discovery scan
      const result = await discoveryService.trigger();

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Discovery failed',
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Discovery scan completed',
        result: result.result,
      });
    }

    if (action === 'start') {
      // Start the discovery service
      discoveryService.start(body.config);

      return NextResponse.json({
        success: true,
        message: 'Discovery service started',
        status: discoveryService.status(),
      });
    }

    if (action === 'stop') {
      // Stop the discovery service
      discoveryService.stop();

      return NextResponse.json({
        success: true,
        message: 'Discovery service stopped',
        status: discoveryService.status(),
      });
    }

    if (action === 'update_config') {
      // Update configuration
      discoveryService.updateConfig(body.config);

      return NextResponse.json({
        success: true,
        message: 'Configuration updated',
        status: discoveryService.status(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action. Use: trigger, start, stop, or update_config',
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
