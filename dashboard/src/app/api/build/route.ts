import { NextRequest, NextResponse } from "next/server";
import { ideas, settings, backgroundJobs, cache } from "@/lib/db";
import { callAI, getBestProvider } from "@/lib/ai-provider";
import { randomUUID } from "crypto";

/**
 * BUILD API - The Core Pipeline
 * This actually builds apps when user submits an idea
 *
 * Flow:
 * 1. Receive idea
 * 2. Validate with AI (using Gemini FREE or configured provider)
 * 3. Generate app spec
 * 4. Queue background build job
 * 5. Return job ID for tracking
 */

interface BuildRequest {
  idea: string;
  runInBackground?: boolean;
}

interface ValidationResult {
  isViable: boolean;
  score: number;
  targetPrice: number;
  targetAudience: string;
  competitors: string[];
  buildComplexity: "simple" | "medium" | "complex";
  estimatedDays: number;
  concerns: string[];
  recommendation: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BuildRequest = await request.json();
    const { idea, runInBackground = true } = body;

    if (!idea?.trim()) {
      return NextResponse.json(
        { success: false, error: "Idea is required" },
        { status: 400 }
      );
    }

    // Get AI provider (prioritizes FREE Gemini)
    const env = {
      GEMINI_API_KEY: settings.get<string>("GEMINI_API_KEY"),
      ANTHROPIC_API_KEY: settings.get<string>("ANTHROPIC_API_KEY"),
      OPENAI_API_KEY: settings.get<string>("OPENAI_API_KEY"),
      GROK_API_KEY: settings.get<string>("GROK_API_KEY"),
    };

    const provider = getBestProvider(env);

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: "No AI API key configured. Add Gemini (FREE) or another AI key in Setup.",
          needsSetup: true,
        },
        { status: 400 }
      );
    }

    // Create idea record
    const ideaId = `idea-${randomUUID().slice(0, 8)}`;
    ideas.create({
      id: ideaId,
      title: idea.slice(0, 100),
      description: idea,
      source: "dashboard",
      score: 0,
      status: "validating",
    });

    // Step 1: Quick validation with AI
    const validationPrompt = `You are an expert startup validator. Analyze this app idea for $10k MRR potential.

IDEA: "${idea}"

Respond in JSON format ONLY (no markdown, no explanation):
{
  "isViable": true/false,
  "score": 0-100,
  "targetPrice": monthly price in USD,
  "targetAudience": "specific persona",
  "competitors": ["competitor1", "competitor2"],
  "buildComplexity": "simple" | "medium" | "complex",
  "estimatedDays": number,
  "concerns": ["concern1", "concern2"],
  "recommendation": "BUILD" | "CONSIDER" | "PASS",
  "appName": "suggested app name",
  "tagline": "one line description",
  "coreFeatures": ["feature1", "feature2", "feature3"]
}`;

    let validation: ValidationResult & { appName?: string; tagline?: string; coreFeatures?: string[] };

    try {
      const response = await callAI(
        [{ role: "user", content: validationPrompt }],
        provider
      );

      // Parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    } catch (aiError) {
      console.error("AI validation error:", aiError);
      // Use defaults if AI fails
      validation = {
        isViable: true,
        score: 65,
        targetPrice: 19,
        targetAudience: "Small business owners",
        competitors: ["Unknown"],
        buildComplexity: "medium",
        estimatedDays: 7,
        concerns: ["AI validation unavailable"],
        recommendation: "CONSIDER",
        appName: idea.split(" ").slice(0, 3).join(" "),
        tagline: idea.slice(0, 60),
        coreFeatures: ["Core functionality"],
      };
    }

    // Update idea with validation results
    ideas.update(ideaId, {
      score: validation.score,
      status: validation.isViable ? "validated" : "rejected",
    });

    // If not viable, return early
    if (!validation.isViable || validation.recommendation === "PASS") {
      return NextResponse.json({
        success: true,
        phase: "validation",
        ideaId,
        validation,
        message: "Idea did not pass validation. Consider revising.",
        nextSteps: validation.concerns,
      });
    }

    // Step 2: Create background build job
    const jobId = `build-${randomUUID().slice(0, 8)}`;

    if (runInBackground) {
      // Queue the build job
      backgroundJobs.create({
        id: jobId,
        type: "build_app",
        status: "queued",
        data: JSON.stringify({
          ideaId,
          idea,
          validation,
          provider: provider.provider,
        }),
        createdAt: new Date().toISOString(),
      });

      // Clear caches
      cache.delete("dashboard_data");

      return NextResponse.json({
        success: true,
        phase: "queued",
        ideaId,
        jobId,
        validation,
        message: "Build job queued! The system will build your app in the background.",
        trackingUrl: `/api/build/status/${jobId}`,
        nextSteps: [
          "App will be generated using your configured AI",
          "Code will be saved to /generated-apps/",
          "You'll be notified when ready to deploy",
        ],
      });
    } else {
      // Synchronous build (for testing)
      return NextResponse.json({
        success: true,
        phase: "ready",
        ideaId,
        validation,
        message: "Validation complete. Ready to build.",
        buildCommand: `claude "Build this app: ${validation.appName || idea}"`,
      });
    }
  } catch (error) {
    console.error("Build API error:", error);
    return NextResponse.json(
      { success: false, error: "Build pipeline error" },
      { status: 500 }
    );
  }
}

// GET: Check build status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (jobId) {
    const job = backgroundJobs.get(jobId);
    if (job) {
      return NextResponse.json({
        success: true,
        job,
      });
    }
    return NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    );
  }

  // Return all pending jobs
  const jobs = backgroundJobs.getPending();
  return NextResponse.json({
    success: true,
    jobs,
    count: jobs.length,
  });
}
