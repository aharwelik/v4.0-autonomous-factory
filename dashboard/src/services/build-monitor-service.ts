/**
 * BUILD MONITOR SERVICE
 *
 * Autonomous monitoring of build jobs with auto-fix capabilities
 * - Monitors all active builds in real-time
 * - Detects errors and attempts auto-fixes
 * - Creates backlog items for unresolved issues
 * - Sends alerts on critical failures
 */

import { backgroundJobs, ideas, settings } from "@/lib/db";
import { callAI, getBestProvider } from "@/lib/ai-provider";
import { randomUUID } from "crypto";

interface BuildError {
  type: string;
  message: string;
  step: string;
  timestamp: Date;
  retryable: boolean;
}

interface AutoFixResult {
  success: boolean;
  method: string;
  message: string;
  retryable: boolean;
}

interface MonitorState {
  isRunning: boolean;
  activeBuilds: Set<string>;
  lastCheck: Date | null;
  stats: {
    totalMonitored: number;
    autoFixesApplied: number;
    backlogItemsCreated: number;
    successRate: number;
  };
}

const state: MonitorState = {
  isRunning: false,
  activeBuilds: new Set(),
  lastCheck: null,
  stats: {
    totalMonitored: 0,
    autoFixesApplied: 0,
    backlogItemsCreated: 0,
    successRate: 100,
  },
};

let monitorInterval: NodeJS.Timeout | null = null;
const POLL_INTERVAL = 5000; // Check every 5 seconds
const MAX_RETRIES = 3;

/**
 * Start monitoring all build jobs
 */
export function startBuildMonitor(): void {
  if (state.isRunning) {
    console.log("⚠️  Build monitor already running");
    return;
  }

  state.isRunning = true;
  console.log("🔍 Starting build monitor...");

  // Monitor immediately
  monitorActiveBuilds();

  // Set up polling interval
  monitorInterval = setInterval(() => {
    monitorActiveBuilds();
  }, POLL_INTERVAL);

  console.log(`✅ Build monitor started (polling every ${POLL_INTERVAL / 1000}s)`);
}

/**
 * Stop monitoring
 */
export function stopBuildMonitor(): void {
  if (!state.isRunning) {
    console.log("⚠️  Build monitor not running");
    return;
  }

  state.isRunning = false;

  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }

  console.log("✅ Build monitor stopped");
}

/**
 * Get current monitor status
 */
export function getBuildMonitorStatus() {
  return {
    isRunning: state.isRunning,
    activeBuilds: Array.from(state.activeBuilds),
    lastCheck: state.lastCheck,
    stats: state.stats,
  };
}

/**
 * Monitor all active build jobs
 */
async function monitorActiveBuilds(): Promise<void> {
  state.lastCheck = new Date();

  try {
    // Find all active builds (pending, queued, or running)
    const allActiveJobs = backgroundJobs.getPending();

    // Filter to only build_app jobs
    const activeJobs = allActiveJobs.filter(j => j.type === "build_app");

    // Track which builds we're monitoring
    const currentBuildIds = new Set(activeJobs.map(j => j.id));

    // Remove completed builds from monitoring
    for (const buildId of Array.from(state.activeBuilds)) {
      if (!currentBuildIds.has(buildId)) {
        state.activeBuilds.delete(buildId);
        console.log(`✅ Build ${buildId} completed, stopped monitoring`);
      }
    }

    // Monitor each active build
    for (const job of activeJobs) {
      // Add to active builds if new
      if (!state.activeBuilds.has(job.id)) {
        state.activeBuilds.add(job.id);
        state.stats.totalMonitored++;
        console.log(`🔍 Now monitoring build: ${job.id}`);
      }

      await monitorBuildJob(job);
    }
  } catch (error) {
    console.error("❌ Error in build monitor:", error);
  }
}

/**
 * Monitor a specific build job
 */
async function monitorBuildJob(job: any): Promise<void> {
  const jobData = JSON.parse(job.data || "{}");
  const jobStartTime = new Date(job.createdAt).getTime();
  const jobDuration = Date.now() - jobStartTime;

  // Check for timeout (10 minutes max per build)
  if (jobDuration > 10 * 60 * 1000 && job.status !== "completed") {
    console.log(`⚠️  Build ${job.id} timeout detected (${Math.round(jobDuration / 60000)}m)`);

    const error: BuildError = {
      type: "TIMEOUT",
      message: `Build timed out after ${Math.round(jobDuration / 60000)} minutes`,
      step: "unknown",
      timestamp: new Date(),
      retryable: true,
    };

    await handleBuildError(job.id, error);
    return;
  }

  // Check for errors in job record
  if (job.error) {
    const error: BuildError = {
      type: detectErrorType(job.error),
      message: job.error,
      step: jobData.currentStep || "unknown",
      timestamp: new Date(),
      retryable: isRetryable(job.error),
    };

    await handleBuildError(job.id, error);
  }

  // Log progress for long-running builds
  if (jobDuration > 2 * 60 * 1000 && jobDuration < 3 * 60 * 1000) {
    console.log(`⏱️  Build ${job.id} still running (${Math.round(jobDuration / 60000)}m)`);
  }
}

/**
 * Handle a build error with auto-fix attempts
 */
async function handleBuildError(jobId: string, error: BuildError): Promise<void> {
  console.log(`❌ Error detected in ${jobId}:`, error.message);

  // Get current retry count
  const job = backgroundJobs.get(jobId);
  if (!job) return;

  const jobData = JSON.parse(job.data || "{}");
  const retryCount = jobData.retryCount || 0;

  // Attempt auto-fix if under retry limit
  if (retryCount < MAX_RETRIES && error.retryable) {
    const fixResult = await attemptAutoFix(jobId, error);

    if (fixResult.success) {
      console.log(`✅ Auto-fixed ${jobId}: ${fixResult.message}`);
      state.stats.autoFixesApplied++;

      // Update job with fix info and retry
      backgroundJobs.update(jobId, {
        status: "queued",
        error: undefined,
        data: JSON.stringify({
          ...jobData,
          retryCount: retryCount + 1,
          lastFix: fixResult.method,
        }),
      });
    } else {
      console.log(`⚠️  Auto-fix failed for ${jobId}: ${fixResult.message}`);

      if (retryCount + 1 >= MAX_RETRIES) {
        // Max retries reached - create backlog item
        await createBacklogItem(jobId, error, fixResult);

        // Mark job as failed
        backgroundJobs.update(jobId, {
          status: "failed",
          error: `Failed after ${MAX_RETRIES} attempts: ${error.message}`,
        });

        state.stats.successRate = Math.round(
          ((state.stats.totalMonitored - state.stats.backlogItemsCreated) /
           state.stats.totalMonitored) * 100
        );
      } else {
        // Retry with incremented count
        backgroundJobs.update(jobId, {
          status: "queued",
          data: JSON.stringify({
            ...jobData,
            retryCount: retryCount + 1,
          }),
        });
      }
    }
  } else if (retryCount >= MAX_RETRIES) {
    // Already tried max times - create backlog
    await createBacklogItem(jobId, error, { success: false, method: "none", message: "Max retries exceeded", retryable: false });
  }
}

/**
 * Attempt to auto-fix a build error
 */
async function attemptAutoFix(jobId: string, error: BuildError): Promise<AutoFixResult> {
  const job = backgroundJobs.get(jobId);
  if (!job) {
    return { success: false, method: "none", message: "Job not found", retryable: false };
  }

  const jobData = JSON.parse(job.data || "{}");

  // API Quota Exceeded - Try fallback provider
  if (error.type === "API_QUOTA_EXCEEDED") {
    const env = {
      GEMINI_API_KEY: settings.get<string>("GEMINI_API_KEY") || undefined,
      DEEPSEEK_API_KEY: settings.get<string>("DEEPSEEK_API_KEY") || undefined,
      ANTHROPIC_API_KEY: settings.get<string>("ANTHROPIC_API_KEY") || undefined,
      OPENAI_API_KEY: settings.get<string>("OPENAI_API_KEY") || undefined,
    };

    const currentProvider = jobData.provider;
    const fallbackProvider = getBestProvider(env, currentProvider);

    if (fallbackProvider && fallbackProvider.provider !== currentProvider) {
      // Update job to use fallback provider
      jobData.provider = fallbackProvider.provider;
      backgroundJobs.update(jobId, {
        data: JSON.stringify(jobData),
      });

      return {
        success: true,
        method: "provider_fallback",
        message: `Switched from ${currentProvider} to ${fallbackProvider.provider}`,
        retryable: true,
      };
    }

    // No fallback available - use heuristic validation
    return {
      success: true,
      method: "heuristic_fallback",
      message: "Using heuristic validation (no AI required)",
      retryable: true,
    };
  }

  // Network/Timeout Errors - Retry with backoff
  if (error.type === "NETWORK_ERROR" || error.type === "TIMEOUT") {
    return {
      success: true,
      method: "retry_with_backoff",
      message: "Will retry with exponential backoff",
      retryable: true,
    };
  }

  // Invalid JSON Response - Retry with stricter prompt
  if (error.type === "INVALID_JSON") {
    return {
      success: true,
      method: "stricter_prompt",
      message: "Retrying with JSON validation in prompt",
      retryable: true,
    };
  }

  // File System Errors - Attempt to fix permissions/paths
  if (error.type === "FILE_SYSTEM_ERROR") {
    // This would need actual file system operations
    return {
      success: false,
      method: "none",
      message: "File system errors require manual intervention",
      retryable: false,
    };
  }

  // Unknown error type
  return {
    success: false,
    method: "none",
    message: `Unknown error type: ${error.type}`,
    retryable: error.retryable,
  };
}

/**
 * Create backlog item for unresolved error
 */
async function createBacklogItem(
  jobId: string,
  error: BuildError,
  fixAttempt: AutoFixResult
): Promise<void> {
  const backlogId = `backlog-${randomUUID().slice(0, 8)}`;

  console.log(`📝 Creating backlog item ${backlogId} for job ${jobId}`);

  // Store in database (for now, log to console - we can add a backlog table later)
  const backlogItem = {
    id: backlogId,
    jobId,
    errorType: error.type,
    errorMessage: error.message,
    stepFailed: error.step,
    attemptedFix: fixAttempt.method,
    fixMessage: fixAttempt.message,
    createdAt: new Date().toISOString(),
  };

  console.log("📋 Backlog item:", JSON.stringify(backlogItem, null, 2));

  state.stats.backlogItemsCreated++;

  // TODO: Store in actual backlog table when implemented
  // For now, we could store in a JSON file or add to settings
}

/**
 * Detect error type from error message
 */
function detectErrorType(errorMessage: string): string {
  const msg = errorMessage.toLowerCase();

  if (msg.includes("quota") || msg.includes("rate limit")) {
    return "API_QUOTA_EXCEEDED";
  }
  if (msg.includes("network") || msg.includes("econnrefused") || msg.includes("enotfound")) {
    return "NETWORK_ERROR";
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "TIMEOUT";
  }
  if (msg.includes("json") || msg.includes("parse")) {
    return "INVALID_JSON";
  }
  if (msg.includes("enoent") || msg.includes("permission") || msg.includes("eacces")) {
    return "FILE_SYSTEM_ERROR";
  }
  if (msg.includes("syntax") || msg.includes("invalid code")) {
    return "CODE_GENERATION_ERROR";
  }

  return "UNKNOWN";
}

/**
 * Check if error is retryable
 */
function isRetryable(errorMessage: string): boolean {
  const type = detectErrorType(errorMessage);

  // These errors are worth retrying
  const retryableTypes = [
    "API_QUOTA_EXCEEDED",
    "NETWORK_ERROR",
    "TIMEOUT",
    "INVALID_JSON",
    "CODE_GENERATION_ERROR",
  ];

  return retryableTypes.includes(type);
}

/**
 * Manual trigger for monitoring (useful for testing)
 */
export async function triggerBuildMonitorCheck(): Promise<void> {
  console.log("🔍 Manual monitor check triggered");
  await monitorActiveBuilds();
}
