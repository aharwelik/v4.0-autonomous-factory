import { NextRequest, NextResponse } from "next/server";
import { settings, apps } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

/**
 * DEPLOY API - Deploy apps to various hosting providers
 *
 * Supported providers:
 * - Vercel (FREE tier, auto-deploy)
 * - Hostinger (Git deploy or FTP)
 * - Railway (auto-deploy)
 */

interface DeployRequest {
  appId: string;
  provider: "vercel" | "hostinger" | "railway";
  options?: {
    domain?: string;
    branch?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: DeployRequest = await request.json();
    const { appId, provider, options = {} } = body;

    if (!appId) {
      return NextResponse.json(
        { success: false, error: "App ID is required" },
        { status: 400 }
      );
    }

    // Get app details
    const app = apps.get(appId);
    if (!app) {
      return NextResponse.json(
        { success: false, error: "App not found" },
        { status: 404 }
      );
    }

    if (!app.path || !fs.existsSync(app.path)) {
      return NextResponse.json(
        { success: false, error: "App files not found" },
        { status: 404 }
      );
    }

    switch (provider) {
      case "vercel":
        return await deployToVercel(app, options);
      case "hostinger":
        return await deployToHostinger(app, options);
      case "railway":
        return await deployToRailway(app, options);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown provider: ${provider}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Deploy error:", error);
    return NextResponse.json(
      { success: false, error: "Deployment failed" },
      { status: 500 }
    );
  }
}

async function deployToVercel(app: { id: string; name: string; path?: string }, options: { domain?: string }) {
  const vercelToken = settings.get<string>("VERCEL_TOKEN");

  if (!vercelToken) {
    return NextResponse.json({
      success: false,
      error: "Vercel token not configured",
      hint: "Add VERCEL_TOKEN in Setup to enable Vercel deployments",
    }, { status: 400 });
  }

  try {
    // Check if Vercel CLI is available
    try {
      execSync("which vercel", { encoding: "utf-8" });
    } catch {
      return NextResponse.json({
        success: false,
        error: "Vercel CLI not installed",
        hint: "Run: npm install -g vercel",
      }, { status: 400 });
    }

    // Deploy using Vercel CLI
    const deployCmd = `cd "${app.path}" && vercel --yes --token ${vercelToken} --prod`;
    const output = execSync(deployCmd, { encoding: "utf-8", timeout: 120000 });

    // Extract URL from output
    const urlMatch = output.match(/https:\/\/[^\s]+\.vercel\.app/);
    const deployUrl = urlMatch ? urlMatch[0] : null;

    if (deployUrl) {
      apps.update(app.id, { deploy_url: deployUrl, status: "deployed" });
    }

    return NextResponse.json({
      success: true,
      provider: "vercel",
      deployUrl,
      message: `Deployed to Vercel: ${deployUrl}`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Vercel deployment failed",
    }, { status: 500 });
  }
}

async function deployToHostinger(app: { id: string; name: string; path?: string }, options: { domain?: string }) {
  const ftpHost = settings.get<string>("HOSTINGER_FTP_HOST");
  const ftpUser = settings.get<string>("HOSTINGER_FTP_USER");
  const ftpPass = settings.get<string>("HOSTINGER_FTP_PASS");
  const gitUrl = settings.get<string>("HOSTINGER_GIT_URL");

  // Method 1: Git Deploy (preferred for Hostinger)
  if (gitUrl) {
    try {
      // Initialize git if needed
      if (!fs.existsSync(path.join(app.path!, ".git"))) {
        execSync(`cd "${app.path}" && git init`, { encoding: "utf-8" });
      }

      // Add remote
      try {
        execSync(`cd "${app.path}" && git remote add hostinger ${gitUrl}`, { encoding: "utf-8" });
      } catch {
        // Remote might already exist
        execSync(`cd "${app.path}" && git remote set-url hostinger ${gitUrl}`, { encoding: "utf-8" });
      }

      // Add, commit, push
      execSync(`cd "${app.path}" && git add -A && git commit -m "Deploy ${app.name}" --allow-empty`, { encoding: "utf-8" });
      execSync(`cd "${app.path}" && git push hostinger main -f`, { encoding: "utf-8", timeout: 120000 });

      const deployUrl = options.domain || `https://${app.name}.yourdomain.com`;
      apps.update(app.id, { deploy_url: deployUrl, status: "deployed" });

      return NextResponse.json({
        success: true,
        provider: "hostinger",
        method: "git",
        deployUrl,
        message: "Deployed via Git push to Hostinger",
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Git deploy failed",
      }, { status: 500 });
    }
  }

  // Method 2: FTP Deploy
  if (ftpHost && ftpUser && ftpPass) {
    try {
      // Check if lftp is available (better than ftp for bulk uploads)
      try {
        execSync("which lftp", { encoding: "utf-8" });
      } catch {
        return NextResponse.json({
          success: false,
          error: "lftp not installed (required for FTP deploy)",
          hint: "Run: brew install lftp (Mac) or apt-get install lftp (Linux)",
        }, { status: 400 });
      }

      // Build the app first
      execSync(`cd "${app.path}" && npm install && npm run build`, { encoding: "utf-8", timeout: 300000 });

      // Upload using lftp
      const remotePath = `/public_html/${app.name}`;
      const localPath = `${app.path}/.next`;

      const lftpCmd = `lftp -u ${ftpUser},${ftpPass} ${ftpHost} -e "mirror -R ${localPath} ${remotePath}; quit"`;
      execSync(lftpCmd, { encoding: "utf-8", timeout: 300000 });

      const deployUrl = options.domain || `https://${ftpHost}/${app.name}`;
      apps.update(app.id, { deploy_url: deployUrl, status: "deployed" });

      return NextResponse.json({
        success: true,
        provider: "hostinger",
        method: "ftp",
        deployUrl,
        message: "Deployed via FTP to Hostinger",
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "FTP deploy failed",
      }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: false,
    error: "Hostinger not configured",
    hint: "Add HOSTINGER_GIT_URL or HOSTINGER_FTP_HOST/USER/PASS in Setup",
    setupSteps: [
      "1. Go to Hostinger hPanel → Websites → Your Site",
      "2. Find 'Git' section for git deploy URL",
      "3. Or find 'FTP Accounts' for FTP credentials",
      "4. Add the credentials in the Setup section",
    ],
  }, { status: 400 });
}

async function deployToRailway(app: { id: string; name: string; path?: string }, options: { domain?: string }) {
  const railwayToken = settings.get<string>("RAILWAY_TOKEN");

  if (!railwayToken) {
    return NextResponse.json({
      success: false,
      error: "Railway token not configured",
      hint: "Add RAILWAY_TOKEN in Setup to enable Railway deployments",
    }, { status: 400 });
  }

  try {
    // Check if Railway CLI is available
    try {
      execSync("which railway", { encoding: "utf-8" });
    } catch {
      return NextResponse.json({
        success: false,
        error: "Railway CLI not installed",
        hint: "Run: npm install -g @railway/cli",
      }, { status: 400 });
    }

    // Deploy using Railway CLI
    const deployCmd = `cd "${app.path}" && railway login --browserless && railway up`;
    const output = execSync(deployCmd, {
      encoding: "utf-8",
      timeout: 180000,
      env: { ...process.env, RAILWAY_TOKEN: railwayToken }
    });

    // Extract URL from output
    const urlMatch = output.match(/https:\/\/[^\s]+\.railway\.app/);
    const deployUrl = urlMatch ? urlMatch[0] : null;

    if (deployUrl) {
      apps.update(app.id, { deploy_url: deployUrl, status: "deployed" });
    }

    return NextResponse.json({
      success: true,
      provider: "railway",
      deployUrl,
      message: `Deployed to Railway: ${deployUrl}`,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Railway deployment failed",
    }, { status: 500 });
  }
}

// GET: Check deployment status and available providers
export async function GET() {
  const providers = {
    vercel: {
      configured: !!settings.get<string>("VERCEL_TOKEN"),
      cost: "FREE tier",
      bestFor: "Next.js apps",
    },
    hostinger: {
      configured: !!(settings.get<string>("HOSTINGER_GIT_URL") ||
        (settings.get<string>("HOSTINGER_FTP_HOST") && settings.get<string>("HOSTINGER_FTP_USER"))),
      cost: "$3-12/mo",
      bestFor: "Traditional hosting + Node.js",
    },
    railway: {
      configured: !!settings.get<string>("RAILWAY_TOKEN"),
      cost: "$5/mo minimum",
      bestFor: "Full-stack apps",
    },
  };

  const configuredCount = Object.values(providers).filter(p => p.configured).length;

  return NextResponse.json({
    success: true,
    providers,
    summary: {
      configured: configuredCount,
      total: Object.keys(providers).length,
      ready: configuredCount > 0,
    },
    recommendation: !providers.vercel.configured
      ? "Add VERCEL_TOKEN for free auto-deploys"
      : "Ready to deploy!",
  });
}
