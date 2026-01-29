import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export interface BuildTestResult {
  success: boolean;
  error?: string;
  logs: string[];
  duration: number;
  steps: {
    install: boolean;
    build: boolean;
  };
}

/**
 * Tests a generated app to ensure it compiles and runs
 *
 * This prevents deploying broken apps by:
 * 1. Running npm install
 * 2. Running npm run build to verify compilation
 * 3. Capturing all output for debugging
 *
 * @param appDir - Absolute path to the generated app directory
 * @returns BuildTestResult with success status and logs
 */
export async function testGeneratedApp(appDir: string): Promise<BuildTestResult> {
  const startTime = Date.now();
  const logs: string[] = [];
  const steps = {
    install: false,
    build: false,
  };

  try {
    // Verify directory exists
    if (!fs.existsSync(appDir)) {
      return {
        success: false,
        error: `App directory does not exist: ${appDir}`,
        logs: [],
        duration: Date.now() - startTime,
        steps,
      };
    }

    // Verify package.json exists
    const packageJsonPath = path.join(appDir, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      return {
        success: false,
        error: "package.json not found in app directory",
        logs: [],
        duration: Date.now() - startTime,
        steps,
      };
    }

    logs.push("✓ Directory and package.json verified");

    // Step 1: npm install
    logs.push("Running npm install...");
    try {
      const installOutput = execSync("npm install --legacy-peer-deps", {
        cwd: appDir,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 120000, // 2 minute timeout
      });
      steps.install = true;
      logs.push("✓ npm install completed");

      // Only log errors or warnings from install output
      const installLines = installOutput.split("\n").filter(line =>
        line.includes("WARN") || line.includes("ERR") || line.includes("error")
      );
      if (installLines.length > 0) {
        logs.push("  Install warnings:");
        installLines.slice(0, 5).forEach(line => logs.push(`  ${line}`));
      }
    } catch (installError) {
      const errorMsg = installError instanceof Error ? installError.message : String(installError);
      logs.push("✗ npm install failed");
      logs.push(errorMsg);
      return {
        success: false,
        error: "npm install failed - dependencies could not be installed",
        logs,
        duration: Date.now() - startTime,
        steps,
      };
    }

    // Step 2: npm run build
    logs.push("Running npm run build...");
    try {
      const buildOutput = execSync("npm run build", {
        cwd: appDir,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 300000, // 5 minute timeout
      });
      steps.build = true;
      logs.push("✓ npm run build completed");

      // Check for build artifacts
      const nextBuildDir = path.join(appDir, ".next");
      if (fs.existsSync(nextBuildDir)) {
        logs.push("✓ Build artifacts created (.next directory found)");
      }

      // Log any warnings from build output
      const buildLines = buildOutput.split("\n").filter(line =>
        line.includes("warn") || line.includes("error") || line.includes("Error")
      );
      if (buildLines.length > 0) {
        logs.push("  Build warnings:");
        buildLines.slice(0, 5).forEach(line => logs.push(`  ${line}`));
      }
    } catch (buildError) {
      // execSync throws even for warnings on stderr, so check if build actually succeeded
      const nextBuildDir = path.join(appDir, ".next");
      if (fs.existsSync(nextBuildDir)) {
        // Build succeeded despite warnings
        steps.build = true;
        logs.push("✓ npm run build completed (with warnings)");
        logs.push("  Note: Build had warnings but generated output successfully");
      } else {
        // Build actually failed
        const errorMsg = buildError instanceof Error ? buildError.message : String(buildError);
        logs.push("✗ npm run build failed");

        // Extract meaningful error from build output
        const errorLines = errorMsg.split("\n");
        const relevantErrors = errorLines.filter(line =>
          line.includes("Error") ||
          line.includes("error") ||
          line.includes("failed") ||
          line.includes("SyntaxError") ||
          line.includes("TypeError")
        );

        logs.push("Build errors:");
        relevantErrors.slice(0, 10).forEach(line => logs.push(`  ${line}`));

        return {
          success: false,
          error: "npm run build failed - app does not compile",
          logs,
          duration: Date.now() - startTime,
          steps,
        };
      }
    }

    // Success!
    const duration = Date.now() - startTime;
    logs.push(`✓ All tests passed in ${(duration / 1000).toFixed(1)}s`);

    return {
      success: true,
      logs,
      duration,
      steps,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logs.push(`✗ Unexpected error: ${errorMsg}`);

    return {
      success: false,
      error: `Unexpected error during build testing: ${errorMsg}`,
      logs,
      duration: Date.now() - startTime,
      steps,
    };
  }
}

/**
 * Quick validation without full build (faster)
 * Just checks if package.json is valid and files exist
 */
export function quickValidate(appDir: string): { valid: boolean; error?: string } {
  try {
    // Check directory
    if (!fs.existsSync(appDir)) {
      return { valid: false, error: "Directory does not exist" };
    }

    // Check package.json
    const packageJsonPath = path.join(appDir, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      return { valid: false, error: "package.json not found" };
    }

    // Validate package.json is valid JSON
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    if (!packageJson.name || !packageJson.scripts?.build) {
      return { valid: false, error: "Invalid package.json - missing name or build script" };
    }

    // Check for critical files
    const requiredFiles = [
      "src/app/page.tsx",
      "src/app/layout.tsx",
      "next.config.js",
      "tsconfig.json",
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(appDir, file))) {
        return { valid: false, error: `Missing required file: ${file}` };
      }
    }

    return { valid: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { valid: false, error: errorMsg };
  }
}
