import { NextRequest, NextResponse } from "next/server";
import { backgroundJobs, settings, apps } from "@/lib/db";
import { callAI, getBestProvider } from "@/lib/ai-provider";
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

    // Get AI provider
    const env = {
      GEMINI_API_KEY: settings.get<string>("GEMINI_API_KEY"),
      ANTHROPIC_API_KEY: settings.get<string>("ANTHROPIC_API_KEY"),
      OPENAI_API_KEY: settings.get<string>("OPENAI_API_KEY"),
      GROK_API_KEY: settings.get<string>("GROK_API_KEY"),
    };

    const provider = getBestProvider(env);
    if (!provider) {
      backgroundJobs.update(buildJob.id, { status: "failed", error: "No AI provider configured" });
      return NextResponse.json({ success: false, error: "No AI provider" }, { status: 400 });
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
        "@clerk/nextjs": "^4.29.0",
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

    // Step 3: Generate landing page
    const landingPrompt = `Generate a modern Next.js 14 landing page component for:
APP: "${spec.displayName || appName}"
TAGLINE: "${spec.tagline || jobData.idea}"

Use Tailwind CSS. Include:
- Hero section with headline and CTA
- Features section (3-4 features)
- Pricing section (Free and Pro tiers)
- Footer

Return ONLY the TypeScript code for src/app/page.tsx (no markdown, no explanation):`;

    let landingCode: string;
    try {
      const landingResponse = await callAI([{ role: "user", content: landingPrompt }], provider);
      landingCode = landingResponse.content
        .replace(/```typescript\n?/g, "")
        .replace(/```tsx\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    } catch {
      // Default landing page
      landingCode = `export default function Home() {
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
    }

    // Create directory structure
    fs.mkdirSync(path.join(appDir, "src", "app"), { recursive: true });
    fs.writeFileSync(path.join(appDir, "src", "app", "page.tsx"), landingCode);

    // Generate layout.tsx
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

# Database
DATABASE_URL=

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Payments (Stripe)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
`;
    fs.writeFileSync(path.join(appDir, ".env.example"), envExample);

    // Create app record
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

    // Mark job complete
    backgroundJobs.update(buildJob.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      result: JSON.stringify({ appId, appDir, filesGenerated: 9 })
    });

    return NextResponse.json({
      success: true,
      appId,
      appName,
      appDir,
      message: `App "${spec.displayName || appName}" built successfully!`,
      filesGenerated: [
        "spec.json",
        "package.json",
        "src/app/page.tsx",
        "src/app/layout.tsx",
        "src/app/globals.css",
        "tailwind.config.ts",
        "next.config.js",
        "tsconfig.json",
        "README.md",
        ".env.example"
      ],
      nextSteps: [
        `cd ${appDir} && npm install`,
        "npm run dev",
        "Open http://localhost:3001",
        "Deploy with: vercel deploy"
      ]
    });
  } catch (error) {
    console.error("Build processor error:", error);
    return NextResponse.json(
      { success: false, error: "Build processing failed" },
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
      createdAt: j.createdAt,
    }))
  });
}
