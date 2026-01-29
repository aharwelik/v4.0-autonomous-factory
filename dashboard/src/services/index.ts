/**
 * SERVICES ORCHESTRATOR
 *
 * Manages all background services for the Autonomous App Factory:
 * - Opportunity Discovery (runs every 4 hours)
 * - Build Monitor (runs every 5 seconds)
 * - Content Generation (future)
 * - App Monitoring (future)
 */

import { startDiscoveryService } from "./discovery-service";
import { startBuildMonitor } from "./build-monitor-service";

let servicesStarted = false;

/**
 * Start all background services
 */
export function startAllServices(): void {
  if (servicesStarted) {
    console.log("⚠️  Services already running");
    return;
  }

  console.log("🚀 Starting all background services...");

  try {
    // Start discovery service (runs every 4 hours)
    startDiscoveryService();

    // Start build monitor (runs every 5 seconds)
    startBuildMonitor();

    servicesStarted = true;
    console.log("✅ All services started successfully");
  } catch (error) {
    console.error("❌ Error starting services:", error);
    throw error;
  }
}

/**
 * Check if services are running
 */
export function areServicesRunning(): boolean {
  return servicesStarted;
}

/**
 * Services are started manually via API endpoint
 * to avoid breaking client-side rendering
 *
 * Call startAllServices() from an API route instead
 */
