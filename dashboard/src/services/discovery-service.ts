/**
 * Discovery Service
 * Runs opportunity scanner on a schedule using node-cron
 * Can be started as a standalone service or integrated into the main app
 */

import * as cron from 'node-cron';
import { discoverOpportunities } from '../lib/opportunity-scanner';
import { settings } from '../lib/db';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

interface DiscoveryConfig {
  enabled: boolean;
  schedule: string; // Cron expression
  runOnStartup: boolean;
}

const DEFAULT_CONFIG: DiscoveryConfig = {
  enabled: true,
  schedule: '0 */4 * * *', // Every 4 hours
  runOnStartup: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE STATE
// ═══════════════════════════════════════════════════════════════════════════

let isRunning = false;
let cronTask: ReturnType<typeof cron.schedule> | null = null;
let lastRun: Date | null = null;
let lastResult: {
  discovered: number;
  signals: number;
  error?: string;
} | null = null;

// ═══════════════════════════════════════════════════════════════════════════
// DISCOVERY TASK
// ═══════════════════════════════════════════════════════════════════════════

async function runDiscovery(): Promise<void> {
  if (isRunning) {
    console.log('⏳ Discovery already running, skipping...');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Starting discovery scan at ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));

    const result = await discoverOpportunities();

    lastRun = new Date();
    lastResult = {
      discovered: result.discovered,
      signals: result.signals,
    };

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('='.repeat(60));
    console.log(`✨ Discovery completed in ${duration}s`);
    console.log(`   - New opportunities: ${result.discovered}`);
    console.log(`   - Total signals: ${result.signals}`);
    console.log(`   - Next run: ${getNextRunTime()}`);
    console.log('='.repeat(60) + '\n');

    // Update last run timestamp in settings
    settings.set('discovery_last_run', lastRun.toISOString());
    settings.set('discovery_last_result', lastResult);
  } catch (error) {
    console.error('❌ Discovery error:', error);

    lastResult = {
      discovered: 0,
      signals: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    settings.set('discovery_last_error', {
      timestamp: new Date().toISOString(),
      error: lastResult.error,
    });
  } finally {
    isRunning = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE CONTROL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Start the discovery service
 */
export function startDiscoveryService(config?: Partial<DiscoveryConfig>): void {
  const fullConfig: DiscoveryConfig = {
    ...DEFAULT_CONFIG,
    ...(settings.get('discovery_config') as Partial<DiscoveryConfig> || {}),
    ...config,
  };

  if (!fullConfig.enabled) {
    console.log('📴 Discovery service is disabled');
    return;
  }

  if (cronTask) {
    console.log('⚠️  Discovery service already running');
    return;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎯 Starting Discovery Service');
  console.log('='.repeat(60));
  console.log(`   Schedule: ${fullConfig.schedule}`);
  console.log(`   Run on startup: ${fullConfig.runOnStartup}`);
  console.log('='.repeat(60) + '\n');

  // Save config
  settings.set('discovery_config', fullConfig);

  // Create cron task
  cronTask = cron.schedule(fullConfig.schedule, () => {
    runDiscovery();
  });

  console.log('✅ Discovery service started');

  // Run immediately if configured
  if (fullConfig.runOnStartup) {
    console.log('🔄 Running initial discovery scan...');
    setTimeout(() => runDiscovery(), 5000); // Wait 5s for app to be ready
  }
}

/**
 * Stop the discovery service
 */
export function stopDiscoveryService(): void {
  if (!cronTask) {
    console.log('⚠️  Discovery service is not running');
    return;
  }

  cronTask.stop();
  cronTask = null;

  console.log('🛑 Discovery service stopped');
}

/**
 * Trigger a manual discovery run
 */
export async function triggerDiscovery(): Promise<{
  success: boolean;
  result?: {
    discovered: number;
    signals: number;
  };
  error?: string;
}> {
  if (isRunning) {
    return {
      success: false,
      error: 'Discovery is already running',
    };
  }

  try {
    await runDiscovery();
    return {
      success: true,
      result: lastResult || { discovered: 0, signals: 0 },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get service status
 */
export function getDiscoveryStatus(): {
  isRunning: boolean;
  isEnabled: boolean;
  schedule: string;
  lastRun: string | null;
  lastResult: typeof lastResult;
  nextRun: string | null;
} {
  const config = settings.get('discovery_config') as DiscoveryConfig || DEFAULT_CONFIG;

  return {
    isRunning,
    isEnabled: config.enabled,
    schedule: config.schedule,
    lastRun: lastRun ? lastRun.toISOString() : null,
    lastResult,
    nextRun: getNextRunTime(),
  };
}

/**
 * Update service configuration
 */
export function updateDiscoveryConfig(updates: Partial<DiscoveryConfig>): void {
  const currentConfig = settings.get('discovery_config') as DiscoveryConfig || DEFAULT_CONFIG;
  const newConfig = { ...currentConfig, ...updates };

  settings.set('discovery_config', newConfig);

  // Restart service if it's running
  if (cronTask) {
    stopDiscoveryService();
    startDiscoveryService(newConfig);
  }

  console.log('✅ Discovery config updated:', newConfig);
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getNextRunTime(): string | null {
  if (!cronTask) return null;

  const config = settings.get('discovery_config') as DiscoveryConfig || DEFAULT_CONFIG;
  const schedule = config.schedule;

  // Parse cron expression to estimate next run
  // Simple estimation for "0 */4 * * *" pattern
  if (schedule === '0 */4 * * *') {
    const now = new Date();
    const currentHour = now.getHours();
    const nextHour = Math.ceil((currentHour + 1) / 4) * 4;
    const nextRun = new Date(now);
    nextRun.setHours(nextHour === 24 ? 0 : nextHour, 0, 0, 0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun.toLocaleString();
  }

  return 'Check cron schedule';
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  start: startDiscoveryService,
  stop: stopDiscoveryService,
  trigger: triggerDiscovery,
  status: getDiscoveryStatus,
  updateConfig: updateDiscoveryConfig,
};
