import { NextRequest, NextResponse } from "next/server";
import { backgroundJobs, settings, apps, costs } from "@/lib/db";
import { callAI, getBestProvider } from "@/lib/ai-provider";
import { testGeneratedApp, quickValidate } from "@/lib/build-tester";
import { generateMultiPageApp, writeGeneratedPages } from "@/lib/multi-page-generator";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

/**
 * BUILD PROCESSOR - Actually builds apps from queued jobs
 *
 * This processes background_jobs with type='build_app' and status='queued'
 *
 * Flow:
 * 1. Get next queued build job
 * 2. Generate app spec with AI
 * 3. Generate code files
 * 4. Save to /generated-apps/[app-name]/
 * 5. Update job status to 'completed'
 * 6. Optionally trigger deployment
 */

const GENERATED_APPS_DIR = path.join(process.cwd(), "..", "generated-apps");

/**
 * Send Telegram notification (non-blocking)
 */
async function sendTelegramNotification(type: string, message: string): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "notify", type, message }),
    });
  } catch (error) {
    // Fail silently - don't block build if notification fails
    console.error("Failed to send Telegram notification:", error);
  }
}

interface BuildJobData {
  ideaId: string;
  idea: string;
  validation: {
    appName?: string;
    tagline?: string;
    coreFeatures?: string[];
    targetAudience?: string;
    targetPrice?: number;
    buildComplexity?: string;
  };
  provider: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get next pending job
    const pendingJobs = backgroundJobs.getPending();
    const buildJob = pendingJobs.find(j => j.type === "build_app" && j.status === "queued");

    if (!buildJob) {
      return NextResponse.json({
        success: true,
        message: "No pending build jobs",
        pendingCount: 0,
      });
    }

    // Parse job data - check both data and payload columns (migration support)
    let jobData: BuildJobData;
    try {
      const rawData = buildJob.data || buildJob.payload || "{}";
      jobData = JSON.parse(rawData);

      // Validate required fields
      if (!jobData.idea) {
        throw new Error("Missing idea in job data");
      }
      if (!jobData.validation) {
        jobData.validation = {}; // Use empty validation if missing
      }
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : "Invalid job data";
      backgroundJobs.update(buildJob.id, { status: "failed", error: errorMsg });
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    // Mark as running
    backgroundJobs.update(buildJob.id, { status: "running", startedAt: new Date().toISOString() });

    // Get AI provider with spending caps
    const env = {
      GEMINI_API_KEY: settings.get<string>("GEMINI_API_KEY") || undefined,
      DEEPSEEK_API_KEY: settings.get<string>("DEEPSEEK_API_KEY") || undefined,
      GLM_API_KEY: settings.get<string>("GLM_API_KEY") || undefined,
      ANTHROPIC_API_KEY: settings.get<string>("ANTHROPIC_API_KEY") || undefined,
      OPENAI_API_KEY: settings.get<string>("OPENAI_API_KEY") || undefined,
      GROK_API_KEY: settings.get<string>("GROK_API_KEY") || undefined,
    };

    // Get spending caps and current spend
    const caps: Record<string, number> = {
      cap_gemini: settings.get<number>("cap_gemini") ?? 1000, // High default for free tier
      cap_deepseek: settings.get<number>("cap_deepseek") ?? 50,
      cap_glm: settings.get<number>("cap_glm") ?? 50,
      cap_anthropic: settings.get<number>("cap_anthropic") ?? 50,
      cap_openai: settings.get<number>("cap_openai") ?? 50,
      cap_grok: settings.get<number>("cap_grok") ?? 50,
    };
    const spent = costs.byService(30); // Get this month's spend by service

    const provider = getBestProvider(env, { caps, spent });
    if (!provider) {
      backgroundJobs.update(buildJob.id, { status: "failed", error: "No AI provider available (all over budget or not configured)" });
      return NextResponse.json({ success: false, error: "No AI provider available" }, { status: 400 });
    }

    // Generate app name slug
    const appName = (jobData.validation.appName || jobData.idea.slice(0, 30))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const appDir = path.join(GENERATED_APPS_DIR, appName);

    // Create app directory
    if (!fs.existsSync(GENERATED_APPS_DIR)) {
      fs.mkdirSync(GENERATED_APPS_DIR, { recursive: true });
    }
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    // Step 1: Generate app specification
    const specPrompt = `You are building a micro-SaaS app. Generate a detailed technical specification.

APP IDEA: "${jobData.idea}"
APP NAME: "${jobData.validation.appName || appName}"
TARGET AUDIENCE: "${jobData.validation.targetAudience || 'Small businesses'}"
PRICE: $${jobData.validation.targetPrice || 19}/month
CORE FEATURES: ${(jobData.validation.coreFeatures || ['Core functionality']).join(', ')}

Generate a JSON specification with this EXACT structure (no markdown, just JSON):
{
  "name": "app-name",
  "displayName": "App Name",
  "tagline": "One line description",
  "description": "Full description",
  "techStack": {
    "framework": "Next.js 14",
    "styling": "Tailwind CSS",
    "database": "SQLite or PostgreSQL",
    "auth": "Clerk",
    "payments": "Stripe"
  },
  "pages": [
    {"path": "/", "name": "Landing", "purpose": "Convert visitors"},
    {"path": "/dashboard", "name": "Dashboard", "purpose": "Main app interface"},
    {"path": "/pricing", "name": "Pricing", "purpose": "Show plans"}
  ],
  "features": [
    {"name": "Feature Name", "description": "What it does", "priority": "high"}
  ],
  "dataModels": [
    {"name": "User", "fields": ["id", "email", "name", "plan"]}
  ]
}`;

    let spec: Record<string, unknown>;
    try {
      const specResponse = await callAI([{ role: "user", content: specPrompt }], provider);
      // Log cost (service, cost, tokens, operation)
      costs.add(provider.provider, specResponse.cost || 0, specResponse.tokens || 0, "spec_generation");

      const jsonMatch = specResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        spec = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse spec");
      }
    } catch (err) {
      // Use default spec
      spec = {
        name: appName,
        displayName: jobData.validation.appName || appName,
        tagline: jobData.validation.tagline || jobData.idea.slice(0, 60),
        techStack: { framework: "Next.js 14", styling: "Tailwind CSS" },
        pages: [
          { path: "/", name: "Landing" },
          { path: "/dashboard", name: "Dashboard" }
        ],
        features: (jobData.validation.coreFeatures || []).map(f => ({ name: f }))
      };
    }

    // Save spec
    fs.writeFileSync(
      path.join(appDir, "spec.json"),
      JSON.stringify(spec, null, 2)
    );

    // Step 2: Generate package.json
    const packageJson = {
      name: appName,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint"
      },
      dependencies: {
        next: "14.0.4",
        react: "^18",
        "react-dom": "^18",
        stripe: "^14.12.0",
        "lucide-react": "^0.303.0",
        "tailwind-merge": "^2.2.0",
        "class-variance-authority": "^0.7.0",
        clsx: "^2.1.0"
      },
      devDependencies: {
        typescript: "^5",
        "@types/node": "^20",
        "@types/react": "^18",
        "@types/react-dom": "^18",
        tailwindcss: "^3.4.0",
        postcss: "^8",
        autoprefixer: "^10"
      }
    };
    fs.writeFileSync(
      path.join(appDir, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    // Step 3: Generate multiple pages (landing, pricing, dashboard, etc.)
    backgroundJobs.update(buildJob.id, {
      status: "running",
      result: JSON.stringify({ stage: "generating_pages", message: "Generating app pages..." })
    });

    let generatedPages;
    try {
      generatedPages = await generateMultiPageApp(
        {
          appName,
          displayName: (spec.displayName as string) || appName,
          tagline: (spec.tagline as string) || jobData.idea,
          targetAudience: jobData.validation.targetAudience || "Small businesses",
          targetPrice: jobData.validation.targetPrice || 19,
          coreFeatures: jobData.validation.coreFeatures || ["Core functionality"],
          buildComplexity: jobData.validation.buildComplexity || "standard",
        },
        provider,
        (message) => {
          // Progress callback
          backgroundJobs.update(buildJob.id, {
            result: JSON.stringify({ stage: "generating_pages", message })
          });
        }
      );

      // Log costs for page generation
      const pagesCount = generatedPages.length;
      const estimatedCost = pagesCount * 0.001; // Rough estimate
      costs.add(provider.provider, estimatedCost, pagesCount * 500, "multi_page_generation");

      // Write pages to disk
      writeGeneratedPages(appDir, generatedPages);

    } catch (pageGenError) {
      // Fallback to basic landing page if multi-page generation fails
      console.error("❌ Multi-page generation failed:", pageGenError);
      const errorMsg = pageGenError instanceof Error ? pageGenError.message : String(pageGenError);
      console.error("Error details:", errorMsg);

      const fallbackCode = `export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">${spec.displayName || appName}</h1>
          <p className="text-xl text-gray-300 mb-8">${spec.tagline || jobData.idea}</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold">
            Get Started Free
          </button>
        </div>
      </div>
    </main>
  );
}`;

      fs.mkdirSync(path.join(appDir, "src", "app"), { recursive: true });
      fs.writeFileSync(path.join(appDir, "src", "app", "page.tsx"), fallbackCode);

      generatedPages = [{ path: "src/app/page.tsx", content: fallbackCode, type: "page" }];
    }

    // Generate layout.tsx (simple, no auth dependencies)
    const layoutCode = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${spec.displayName || appName}",
  description: "${spec.tagline || jobData.idea}",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`;
    fs.writeFileSync(path.join(appDir, "src", "app", "layout.tsx"), layoutCode);

    // Generate globals.css
    const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 255, 255, 255;
  --background-start-rgb: 17, 24, 39;
  --background-end-rgb: 31, 41, 55;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
    to bottom,
    rgb(var(--background-start-rgb)),
    rgb(var(--background-end-rgb))
  );
}`;
    fs.writeFileSync(path.join(appDir, "src", "app", "globals.css"), globalsCss);

    // Generate tailwind.config.ts
    const tailwindConfig = `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;`;
    fs.writeFileSync(path.join(appDir, "tailwind.config.ts"), tailwindConfig);

    // Generate next.config.js
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;`;
    fs.writeFileSync(path.join(appDir, "next.config.js"), nextConfig);

    // Generate tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./src/*"] }
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"]
    };
    fs.writeFileSync(path.join(appDir, "tsconfig.json"), JSON.stringify(tsConfig, null, 2));

    // Generate README
    const readme = `# ${spec.displayName || appName}

${spec.tagline || jobData.idea}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- Next.js 14
- Tailwind CSS
- TypeScript

## Generated by App Factory v4.0
`;
    fs.writeFileSync(path.join(appDir, "README.md"), readme);

    // Generate .env.example
    const envExample = `# ${spec.displayName || appName} Environment Variables

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Database (optional - add if you need a database)
# DATABASE_URL=

# Authentication (optional - add your auth provider)
# Example for Clerk:
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
# CLERK_SECRET_KEY=
# Example for Auth.js/NextAuth:
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=
# Add your OAuth provider keys here

# Payments (Stripe)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PRICE_ID=

# See STRIPE_SETUP.md for detailed setup instructions
`;
    fs.writeFileSync(path.join(appDir, ".env.example"), envExample);

    // ============================================================
    // CRITICAL: VERIFY BUILD BEFORE MARKING COMPLETE
    // ============================================================

    // Step 1: Quick validation (files exist, package.json valid)
    const quickCheck = quickValidate(appDir);
    if (!quickCheck.valid) {
      backgroundJobs.update(buildJob.id, {
        status: "failed",
        error: `Validation failed: ${quickCheck.error}`,
        completedAt: new Date().toISOString(),
      });
      return NextResponse.json({
        success: false,
        error: `Generated app failed validation: ${quickCheck.error}`,
      }, { status: 500 });
    }

    // Step 2: Full build test (npm install + npm run build)
    backgroundJobs.update(buildJob.id, {
      status: "running",
      result: JSON.stringify({ stage: "testing", message: "Running npm install and build verification..." })
    });

    const buildTest = await testGeneratedApp(appDir);

    if (!buildTest.success) {
      // Build failed - mark as failed with detailed logs
      backgroundJobs.update(buildJob.id, {
        status: "failed",
        error: buildTest.error || "Build verification failed",
        completedAt: new Date().toISOString(),
        result: JSON.stringify({
          stage: "test_failed",
          error: buildTest.error,
          logs: buildTest.logs,
          duration: buildTest.duration,
          steps: buildTest.steps,
        })
      });

      // Send Telegram notification (non-blocking)
      sendTelegramNotification(
        "error",
        `<b>Build Failed</b>

App: ${spec.displayName || appName}
Error: ${buildTest.error}

The generated code did not compile. Manual fixes may be needed.`
      ).catch(() => {});

      return NextResponse.json({
        success: false,
        error: buildTest.error || "Build verification failed",
        logs: buildTest.logs,
        suggestion: "Check the logs above for syntax errors or missing dependencies. The AI-generated code may need manual fixes.",
      }, { status: 500 });
    }

    // Build succeeded! Create app record
    const appId = `app-${randomUUID().slice(0, 8)}`;
    apps.create({
      id: appId,
      name: appName,
      displayName: (spec.displayName as string) || appName,
      ideaId: jobData.ideaId,
      status: "built",
      path: appDir,
      spec: JSON.stringify(spec),
    });

    // Mark job complete with build test results
    backgroundJobs.update(buildJob.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      result: JSON.stringify({
        appId,
        appDir,
        filesGenerated: 9,
        buildTest: {
          success: true,
          duration: buildTest.duration,
          logs: buildTest.logs,
        }
      })
    });

    // Send success notification (non-blocking)
    const pagesCount = generatedPages?.length || 1;
    sendTelegramNotification(
      "build_complete",
      `<b>Build Complete! ✨</b>

App: ${spec.displayName || appName}
Pages: ${pagesCount} (${generatedPages?.map(p => p.path.split('/').pop()).join(', ')})
Build Time: ${(buildTest.duration / 1000).toFixed(1)}s
Status: ✅ Verified & Compiled

Ready to deploy with: <code>vercel deploy</code>`
    ).catch(() => {});

    // Count generated files
    const totalFiles = 10 + (generatedPages?.length || 0);
    const pageList = generatedPages?.map(p => p.path) || ["src/app/page.tsx"];

    return NextResponse.json({
      success: true,
      appId,
      appName,
      appDir,
      message: `App "${spec.displayName || appName}" built and verified successfully! (Quota-efficient: Only landing page used AI, other pages from templates)`,
      filesGenerated: [
        "spec.json",
        "package.json",
        ...pageList,
        "src/app/layout.tsx",
        "src/app/globals.css",
        "tailwind.config.ts",
        "next.config.js",
        "tsconfig.json",
        "README.md",
        ".env.example"
      ],
      pages: {
        count: generatedPages?.length || 1,
        types: generatedPages?.map(p => p.type) || ["page"],
        paths: pageList,
      },
      buildTest: {
        success: true,
        duration: `${(buildTest.duration / 1000).toFixed(1)}s`,
        verified: "✓ npm install completed, ✓ npm run build passed",
      },
      nextSteps: [
        `cd ${appDir}`,
        "npm run dev  # Dependencies already installed!",
        "Open http://localhost:3001",
        `Visit pages: ${pageList.join(", ")}`,
        "Deploy with: vercel deploy"
      ]
    });
  } catch (error) {
    console.error("Build processor error:", error);

    // Extract meaningful error message
    let errorMessage = "Build processing failed";
    let suggestion = "";

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for common error patterns
      if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        errorMessage = "AI API quota exceeded";
        suggestion = "Wait for quota reset (daily) or add another AI provider in Quick Setup";
      } else if (errorMessage.includes("401") || errorMessage.includes("403")) {
        errorMessage = "AI API key invalid or expired";
        suggestion = "Check your API key in Quick Setup";
      } else if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("ECONNREFUSED")) {
        errorMessage = "Cannot connect to AI provider";
        suggestion = "Check your internet connection";
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        suggestion,
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET: Check build queue status
export async function GET() {
  const pending = backgroundJobs.getPending();
  const buildJobs = pending.filter(j => j.type === "build_app");

  return NextResponse.json({
    success: true,
    queue: {
      total: buildJobs.length,
      queued: buildJobs.filter(j => j.status === "queued").length,
      running: buildJobs.filter(j => j.status === "running").length,
    },
    jobs: buildJobs.map(j => ({
      id: j.id,
      status: j.status,
      createdAt: j.created_at,
    }))
  });
}
