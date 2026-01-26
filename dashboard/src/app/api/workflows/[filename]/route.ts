import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Serves n8n workflow JSON files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;

  // Security: only allow specific workflow files
  const allowedFiles = ["content-generation.json", "opportunity-discovery.json"];

  if (!allowedFiles.includes(filename)) {
    return NextResponse.json(
      { error: "Workflow not found" },
      { status: 404 }
    );
  }

  // Try multiple possible paths
  const possiblePaths = [
    join(process.cwd(), "..", "workflows", "n8n-templates", filename),
    join(process.cwd(), "workflows", "n8n-templates", filename),
    join(process.cwd(), "..", "..", "workflows", "n8n-templates", filename),
  ];

  for (const filePath of possiblePaths) {
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, "utf-8");
        const workflow = JSON.parse(content);

        return NextResponse.json(workflow, {
          headers: {
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      } catch (error) {
        console.error("Error reading workflow:", error);
      }
    }
  }

  // Fallback: return a redirect to GitHub raw file
  return NextResponse.redirect(
    `https://raw.githubusercontent.com/aharwelik/v4.0-autonomous-factory/main/workflows/n8n-templates/${filename}`
  );
}
