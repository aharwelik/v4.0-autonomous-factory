import { NextRequest, NextResponse } from "next/server";
import { settings } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";

/**
 * n8n Workflow Import API
 * Automatically imports all workflow templates into running n8n instance
 */

const WORKFLOWS_DIR = path.join(process.cwd(), "..", "workflows", "n8n-templates");

interface WorkflowImportResult {
  name: string;
  status: "imported" | "exists" | "error";
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const n8nUrl = settings.get<string>("n8n_url") || "http://localhost:5678";
    const n8nApiKey = settings.get<string>("n8n_api_key") || "";

    // Check if n8n is running
    try {
      const healthCheck = await fetch(`${n8nUrl}/healthz`, {
        method: "GET",
        signal: AbortSignal.timeout(3000)
      });
      if (!healthCheck.ok) {
        return NextResponse.json({
          success: false,
          error: "n8n is not running. Start it with: ./start.sh",
          n8nUrl,
        }, { status: 503 });
      }
    } catch {
      return NextResponse.json({
        success: false,
        error: "Cannot connect to n8n. Make sure it's running on " + n8nUrl,
        hint: "Run ./start.sh to start n8n",
      }, { status: 503 });
    }

    // Get existing workflows from n8n
    let existingWorkflows: string[] = [];
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (n8nApiKey) {
        headers["X-N8N-API-KEY"] = n8nApiKey;
      }

      const existingRes = await fetch(`${n8nUrl}/api/v1/workflows`, { headers });
      if (existingRes.ok) {
        const data = await existingRes.json();
        existingWorkflows = (data.data || []).map((w: { name: string }) => w.name);
      }
    } catch {
      // Continue anyway - will just try to import
    }

    // Read workflow templates
    const results: WorkflowImportResult[] = [];

    if (!fs.existsSync(WORKFLOWS_DIR)) {
      return NextResponse.json({
        success: false,
        error: "Workflows directory not found",
        path: WORKFLOWS_DIR,
      }, { status: 404 });
    }

    const files = fs.readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(WORKFLOWS_DIR, file);
      const workflowName = file.replace(".json", "").replace(/-/g, " ");

      try {
        // Check if already exists
        if (existingWorkflows.some(w => w.toLowerCase().includes(workflowName.toLowerCase()))) {
          results.push({ name: workflowName, status: "exists" });
          continue;
        }

        // Read and parse workflow
        const workflowData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        // Import to n8n
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (n8nApiKey) {
          headers["X-N8N-API-KEY"] = n8nApiKey;
        }

        const importRes = await fetch(`${n8nUrl}/api/v1/workflows`, {
          method: "POST",
          headers,
          body: JSON.stringify(workflowData),
        });

        if (importRes.ok) {
          results.push({ name: workflowName, status: "imported" });
        } else {
          const errText = await importRes.text();
          results.push({ name: workflowName, status: "error", error: errText });
        }
      } catch (err) {
        results.push({
          name: workflowName,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error"
        });
      }
    }

    const imported = results.filter(r => r.status === "imported").length;
    const exists = results.filter(r => r.status === "exists").length;
    const errors = results.filter(r => r.status === "error").length;

    return NextResponse.json({
      success: true,
      summary: {
        imported,
        alreadyExists: exists,
        errors,
        total: results.length,
      },
      results,
      n8nUrl,
      message: imported > 0
        ? `Imported ${imported} workflow(s) successfully!`
        : exists > 0
          ? "All workflows already exist in n8n"
          : "No workflows to import",
    });
  } catch (error) {
    console.error("Workflow import error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to import workflows" },
      { status: 500 }
    );
  }
}

// GET: Check workflow status
export async function GET() {
  try {
    const n8nUrl = settings.get<string>("n8n_url") || "http://localhost:5678";

    // Check n8n status
    let n8nRunning = false;
    let workflows: { name: string; active: boolean }[] = [];

    try {
      const healthCheck = await fetch(`${n8nUrl}/healthz`, {
        signal: AbortSignal.timeout(2000)
      });
      n8nRunning = healthCheck.ok;

      if (n8nRunning) {
        const res = await fetch(`${n8nUrl}/api/v1/workflows`);
        if (res.ok) {
          const data = await res.json();
          workflows = (data.data || []).map((w: { name: string; active: boolean }) => ({
            name: w.name,
            active: w.active,
          }));
        }
      }
    } catch {
      n8nRunning = false;
    }

    // Check available templates
    let templates: string[] = [];
    if (fs.existsSync(WORKFLOWS_DIR)) {
      templates = fs.readdirSync(WORKFLOWS_DIR)
        .filter(f => f.endsWith(".json"))
        .map(f => f.replace(".json", ""));
    }

    return NextResponse.json({
      success: true,
      n8n: {
        running: n8nRunning,
        url: n8nUrl,
        workflowCount: workflows.length,
        workflows,
      },
      templates: {
        available: templates.length,
        list: templates,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to check workflow status" },
      { status: 500 }
    );
  }
}
