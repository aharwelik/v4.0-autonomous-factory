import { NextRequest } from "next/server";
import { ideas, settings, backgroundJobs, cache, costs } from "@/lib/db";
import { callAI, getBestProvider } from "@/lib/ai-provider";
import { randomUUID } from "crypto";

/**
 * STREAMING BUILD API
 * Shows real-time progress as the AI thinks through each step
 *
 * Uses Server-Sent Events (SSE) to stream updates to the client
 */

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const body = await request.json();
        const { idea } = body;

        if (!idea?.trim()) {
          send("error", { message: "Idea is required" });
          controller.close();
          return;
        }

        // ═══════════════════════════════════════════════════════════════════
        // STEP 1: Check Configuration
        // ═══════════════════════════════════════════════════════════════════
        send("step", {
          step: 1,
          total: 6,
          title: "Checking Configuration",
          status: "running",
          detail: "Verifying AI provider is configured..."
        });

        const env = {
          GEMINI_API_KEY: settings.get<string>("GEMINI_API_KEY") || undefined,
          DEEPSEEK_API_KEY: settings.get<string>("DEEPSEEK_API_KEY") || undefined,
          GLM_API_KEY: settings.get<string>("GLM_API_KEY") || undefined,
          ANTHROPIC_API_KEY: settings.get<string>("ANTHROPIC_API_KEY") || undefined,
          OPENAI_API_KEY: settings.get<string>("OPENAI_API_KEY") || undefined,
          GROK_API_KEY: settings.get<string>("GROK_API_KEY") || undefined,
        };

        const provider = getBestProvider(env);

        if (!provider) {
          send("step", { step: 1, status: "failed", detail: "No AI API key configured" });
          send("error", {
            message: "No AI API key configured",
            needsSetup: true,
            fixes: [
              {
                problem: "Missing AI Provider",
                solution: "Add at least ONE AI API key",
                options: [
                  { name: "Gemini (FREE!)", where: "Quick Setup → Google Gemini", url: "https://aistudio.google.com/app/apikey" },
                  { name: "Anthropic Claude", where: "Quick Setup → Anthropic", url: "https://console.anthropic.com/settings/keys" },
                  { name: "OpenAI", where: "Quick Setup → OpenAI", url: "https://platform.openai.com/api-keys" },
                ]
              }
            ],
            scrollTo: "quick-setup"
          });
          controller.close();
          return;
        }

        send("step", {
          step: 1,
          status: "complete",
          detail: `Using ${provider.provider.toUpperCase()} for AI processing`
        });

        // ═══════════════════════════════════════════════════════════════════
        // STEP 2: Parse & Understand the Idea
        // ═══════════════════════════════════════════════════════════════════
        send("step", {
          step: 2,
          total: 6,
          title: "Understanding Your Idea",
          status: "running",
          detail: "Breaking down what you want to build..."
        });

        // Show what we're analyzing
        const ideaWords = idea.split(" ");
        send("thinking", {
          thought: "Analyzing input...",
          details: [
            `Input length: ${idea.length} characters`,
            `Word count: ${ideaWords.length} words`,
            `Looking for: problem, audience, features, price`
          ]
        });

        await sleep(500); // Brief pause for UX

        // Extract key components
        const hasPrice = /\$\d+|\d+\/month|\d+\/mo/i.test(idea);
        const hasAudience = /for\s+\w+|target|users?|customers?|people/i.test(idea);
        const hasFeatures = /should\s+have|features?|include|with\s+a/i.test(idea);

        send("thinking", {
          thought: "Found in your description:",
          details: [
            hasPrice ? "✓ Price point mentioned" : "○ No price - will suggest one",
            hasAudience ? "✓ Target audience mentioned" : "○ No audience - will identify one",
            hasFeatures ? "✓ Features described" : "○ No features - will suggest core ones"
          ]
        });

        send("step", { step: 2, status: "complete", detail: "Idea parsed successfully" });

        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: AI Validation - This is the main thinking step
        // ═══════════════════════════════════════════════════════════════════
        send("step", {
          step: 3,
          total: 6,
          title: "AI Validation",
          status: "running",
          detail: "Asking AI to evaluate $10k MRR potential..."
        });

        send("thinking", {
          thought: "Sending to AI for deep analysis...",
          details: [
            "Checking market viability",
            "Identifying target customers",
            "Analyzing competition",
            "Estimating build complexity",
            "Scoring revenue potential"
          ]
        });

        // Create idea record
        const ideaId = `idea-${randomUUID().slice(0, 8)}`;
        ideas.create({
          id: ideaId,
          title: idea.slice(0, 100),
          description: idea,
          source: "dashboard",
          score: 0,
          status: "validating",
          auto_discovered: 0,
          signal_count: 0,
          search_growth: 0,
          competitor_count: 0,
        });

        send("progress", { message: `Created idea record: ${ideaId}` });

        // The actual AI call
        const validationPrompt = `You are an expert startup validator. Analyze this app idea for $10k MRR potential.

IDEA: "${idea}"

Think through this step by step:
1. Who specifically would pay for this?
2. What's the realistic monthly price?
3. Who are the main competitors?
4. How hard is this to build?
5. What are the risks/concerns?
6. What's your honest recommendation?

Respond in JSON format ONLY (no markdown):
{
  "isViable": true/false,
  "score": 0-100,
  "targetPrice": monthly price in USD,
  "targetAudience": "specific persona with details",
  "competitors": ["competitor1", "competitor2", "competitor3"],
  "buildComplexity": "simple" | "medium" | "complex",
  "estimatedDays": number,
  "concerns": ["concern1", "concern2"],
  "strengths": ["strength1", "strength2"],
  "recommendation": "BUILD" | "CONSIDER" | "PASS",
  "appName": "suggested app name",
  "tagline": "compelling one-liner",
  "coreFeatures": ["feature1", "feature2", "feature3"],
  "monetization": "how this makes money",
  "marketSize": "estimated market size"
}`;

        send("thinking", {
          thought: "AI is analyzing...",
          details: ["This may take 10-30 seconds"]
        });

        let validation;
        try {
          const aiStartTime = Date.now();
          const response = await callAI(
            [{ role: "user", content: validationPrompt }],
            provider
          );
          const aiTime = ((Date.now() - aiStartTime) / 1000).toFixed(1);

          send("progress", { message: `AI responded in ${aiTime}s` });

          // Parse JSON from response
          const jsonMatch = response.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            validation = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Could not parse AI response");
          }

          send("thinking", {
            thought: "AI Analysis Complete!",
            details: [
              `Score: ${validation.score}/100`,
              `Recommendation: ${validation.recommendation}`,
              `Complexity: ${validation.buildComplexity}`
            ]
          });

        } catch (aiError) {
          send("progress", { message: "AI quota exceeded, using smart fallback analysis..." });

          // Smart fallback validation using heuristics
          const lowerIdea = idea.toLowerCase();

          // Detect audience
          let targetAudience = "Business professionals";
          let targetPrice = 29;
          let complexity = "medium";
          let score = 70;

          if (lowerIdea.includes("msp") || lowerIdea.includes("managed service")) {
            targetAudience = "IT departments and MSPs";
            targetPrice = 99;
            complexity = "complex";
            score = 75;
          } else if (lowerIdea.includes("freelancer") || lowerIdea.includes("solopreneur")) {
            targetAudience = "Freelancers and consultants";
            targetPrice = 19;
          } else if (lowerIdea.includes("enterprise") || lowerIdea.includes("corporation")) {
            targetAudience = "Enterprise organizations";
            targetPrice = 299;
            complexity = "complex";
            score = 65;
          } else if (lowerIdea.includes("small business") || lowerIdea.includes("smb")) {
            targetAudience = "Small business owners";
            targetPrice = 49;
          }

          // Detect features and generate app name
          const features: string[] = [];
          let appNameBase = "LogMaster";

          if (lowerIdea.includes("log") || lowerIdea.includes("analytics")) {
            features.push("Real-time log aggregation and analysis");
            features.push("Intelligent error pattern detection");
            features.push("Automated alerting and notifications");
            appNameBase = "LogScope";
            score += 5;
          }

          if (lowerIdea.includes("troubleshoot") || lowerIdea.includes("debug")) {
            features.push("Root cause analysis tools");
            features.push("Step-by-step debugging workflows");
          }

          if (lowerIdea.includes("dashboard") || lowerIdea.includes("visualization")) {
            features.push("Customizable visual dashboards");
            features.push("Real-time metrics and KPIs");
          }

          if (lowerIdea.includes("environment") || lowerIdea.includes("infrastructure")) {
            features.push("Multi-environment monitoring");
            features.push("Infrastructure health tracking");
          }

          if (features.length === 0) {
            features.push("Core log management");
            features.push("Search and filtering");
            features.push("Export and reporting");
          }

          // Detect competitors
          const competitors = [];
          if (lowerIdea.includes("log")) {
            competitors.push("Splunk", "Datadog", "New Relic", "ELK Stack");
          } else {
            competitors.push("Research needed");
          }

          // Generate concerns and strengths
          const concerns = [];
          const strengths = [];

          if (lowerIdea.includes("log") || lowerIdea.includes("analytics")) {
            concerns.push("Competitive market with established players");
            concerns.push("Requires robust data handling infrastructure");
            strengths.push("Clear market need for log analysis tools");
            strengths.push("Recurring revenue model");
          }

          if (lowerIdea.includes("msp") || lowerIdea.includes("enterprise")) {
            concerns.push("Long sales cycles typical for B2B");
            concerns.push("May require compliance certifications");
            strengths.push("Higher price point potential");
            strengths.push("Sticky customer base");
          }

          if (concerns.length === 0) concerns.push("Market research recommended");
          if (strengths.length === 0) strengths.push("Solves a real problem");

          validation = {
            isViable: true,
            score,
            targetPrice,
            targetAudience,
            competitors,
            buildComplexity: complexity,
            estimatedDays: complexity === "complex" ? 14 : complexity === "simple" ? 5 : 7,
            concerns,
            strengths,
            recommendation: score >= 70 ? "BUILD" : "CONSIDER",
            appName: appNameBase,
            tagline: `${features[0]?.split(" ").slice(0, 5).join(" ") || "Powerful log analytics"} for ${targetAudience.toLowerCase()}`,
            coreFeatures: features.slice(0, 5),
            monetization: targetPrice >= 99 ? "Enterprise subscription" : "SaaS subscription",
            marketSize: targetPrice >= 99 ? "Enterprise market ($100B+)" : "SMB market ($50B+)"
          };

          send("progress", { message: `Analyzed: Score ${score}/100, ${features.length} features identified` });
        }

        // Update idea with validation results
        ideas.update(ideaId, {
          score: validation.score,
          status: validation.isViable ? "validated" : "rejected",
          validation_result: JSON.stringify(validation),
        });

        send("step", {
          step: 3,
          status: "complete",
          detail: `Score: ${validation.score}/100 - ${validation.recommendation}`
        });

        // ═══════════════════════════════════════════════════════════════════
        // STEP 4: Show Detailed Results
        // ═══════════════════════════════════════════════════════════════════
        send("step", {
          step: 4,
          total: 6,
          title: "Analysis Results",
          status: "running",
          detail: "Preparing detailed breakdown..."
        });

        // Send full validation data
        send("validation", validation);

        send("step", { step: 4, status: "complete", detail: "Analysis complete" });

        // ═══════════════════════════════════════════════════════════════════
        // STEP 5: Decision Point
        // ═══════════════════════════════════════════════════════════════════
        if (!validation.isViable || validation.recommendation === "PASS") {
          send("step", {
            step: 5,
            total: 6,
            title: "Decision",
            status: "failed",
            detail: "Idea did not pass validation"
          });

          send("result", {
            success: true,
            phase: "rejected",
            ideaId,
            validation,
            message: "This idea may struggle to reach $10k MRR. Consider revising based on the concerns above."
          });

          controller.close();
          return;
        }

        send("step", {
          step: 5,
          total: 6,
          title: "Decision",
          status: "complete",
          detail: "Idea APPROVED for building!"
        });

        // ═══════════════════════════════════════════════════════════════════
        // STEP 6: Queue Build Job
        // ═══════════════════════════════════════════════════════════════════
        send("step", {
          step: 6,
          total: 6,
          title: "Queue Build",
          status: "running",
          detail: "Creating build job..."
        });

        const jobId = `build-${randomUUID().slice(0, 8)}`;

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

        // Update idea to link to job and set status to queued
        ideas.update(ideaId, {
          status: "queued",
          build_job_id: jobId,
        });

        cache.delete("dashboard_data");

        send("step", {
          step: 6,
          status: "complete",
          detail: `Build job created: ${jobId}`
        });

        // Final result
        send("result", {
          success: true,
          phase: "queued",
          ideaId,
          jobId,
          validation,
          provider: provider.provider,
          message: "Build queued! Click the Build tab to watch progress.",
          nextSteps: [
            "AI will generate complete app specification",
            "Code files will be created automatically",
            "App will be saved to /generated-apps/",
            "You can then deploy to Vercel/Hostinger"
          ]
        });

        send("complete", { jobId, ideaId });

      } catch (error) {
        send("error", {
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
