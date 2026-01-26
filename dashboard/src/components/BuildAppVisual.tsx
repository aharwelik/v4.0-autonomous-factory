"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, Loader2, AlertCircle, Sparkles, Code, Rocket, Image as ImageIcon, Zap } from "lucide-react";

interface BuildStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  icon: React.ReactNode;
}

interface BuildAppVisualProps {
  jobId?: string;
  idea?: string;
  onComplete?: (result: BuildResult) => void;
}

interface BuildResult {
  success: boolean;
  appId?: string;
  appName?: string;
  previewImage?: string;
  error?: string;
}

const DEFAULT_STEPS: BuildStep[] = [
  { id: "validate", name: "Validate Idea", description: "AI checks if idea can make $10k/month", status: "pending", icon: <Sparkles className="w-5 h-5" /> },
  { id: "spec", name: "Generate Spec", description: "Create technical specification", status: "pending", icon: <Code className="w-5 h-5" /> },
  { id: "code", name: "Write Code", description: "AI writes all app files", status: "pending", icon: <Code className="w-5 h-5" /> },
  { id: "image", name: "Generate Preview", description: "Create preview image with AI", status: "pending", icon: <ImageIcon className="w-5 h-5" /> },
  { id: "save", name: "Save App", description: "Store app files locally", status: "pending", icon: <Zap className="w-5 h-5" /> },
  { id: "ready", name: "Ready to Deploy", description: "App is built and ready!", status: "pending", icon: <Rocket className="w-5 h-5" /> },
];

export default function BuildAppVisual({ jobId, idea, onComplete }: BuildAppVisualProps) {
  const [steps, setSteps] = useState<BuildStep[]>(DEFAULT_STEPS);
  const [currentStep, setCurrentStep] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const updateStep = (index: number, status: BuildStep["status"]) => {
    setSteps(prev => prev.map((step, i) =>
      i === index ? { ...step, status } : step
    ));
  };

  // Poll for build status
  useEffect(() => {
    if (!jobId) return;

    setIsBuilding(true);
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/build?jobId=${jobId}`);
        const data = await res.json();

        if (data.job) {
          const job = data.job;

          // Update steps based on job status
          if (job.status === "queued") {
            updateStep(0, "running");
            addLog("Starting validation...");
          } else if (job.status === "running") {
            // Progress through steps
            if (currentStep < 3) {
              updateStep(currentStep, "completed");
              setCurrentStep(prev => prev + 1);
              updateStep(currentStep + 1, "running");
              addLog(`Step ${currentStep + 1} complete`);
            }
          } else if (job.status === "completed") {
            // Mark all steps complete
            setSteps(prev => prev.map(s => ({ ...s, status: "completed" })));
            setIsBuilding(false);
            clearInterval(pollInterval);

            // Parse result
            if (job.result) {
              try {
                const result = JSON.parse(job.result);
                onComplete?.({ success: true, appId: result.appId, appName: result.appName });
              } catch {
                onComplete?.({ success: true });
              }
            }
          } else if (job.status === "failed") {
            setError(job.error || "Build failed");
            updateStep(currentStep, "failed");
            setIsBuilding(false);
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [jobId, currentStep, onComplete]);

  // Start build process
  const startBuild = async () => {
    if (!idea) return;

    setIsBuilding(true);
    setError(null);
    setSteps(DEFAULT_STEPS);
    setCurrentStep(0);
    setLogs([]);
    addLog("Starting build process...");

    // Step 1: Validate
    updateStep(0, "running");
    addLog("Validating idea with AI...");

    try {
      const buildRes = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, runInBackground: true }),
      });
      const buildData = await buildRes.json();

      if (!buildData.success) {
        setError(buildData.error);
        updateStep(0, "failed");
        setIsBuilding(false);
        return;
      }

      updateStep(0, "completed");
      addLog(`Validation complete! Score: ${buildData.validation?.score || "N/A"}/100`);

      if (buildData.validation?.recommendation === "PASS") {
        setError("Idea did not pass validation. Try a different approach.");
        return;
      }

      // Step 2-5: Process build job
      updateStep(1, "running");
      addLog("Generating app specification...");

      // Start the build processor
      const processRes = await fetch("/api/build/process", {
        method: "POST",
      });
      const processData = await processRes.json();

      if (processData.success) {
        // Mark steps complete
        updateStep(1, "completed");
        updateStep(2, "completed");
        updateStep(3, "running");

        addLog("Code generated successfully!");
        addLog(`Files created: ${processData.filesGenerated?.join(", ")}`);

        // Generate preview image
        await generatePreviewImage(processData.appName || idea);

        updateStep(3, "completed");
        updateStep(4, "completed");
        updateStep(5, "completed");

        addLog(`App "${processData.appName}" built successfully!`);
        addLog(`Location: ${processData.appDir}`);

        onComplete?.({
          success: true,
          appId: processData.appId,
          appName: processData.appName,
          previewImage,
        });
      } else {
        throw new Error(processData.error || "Build failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Build failed");
      updateStep(currentStep, "failed");
    } finally {
      setIsBuilding(false);
    }
  };

  // Generate preview image with Gemini
  const generatePreviewImage = async (appName: string) => {
    addLog("Generating preview image...");

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Modern SaaS landing page screenshot for an app called "${appName}". Clean UI, dark mode, professional design, hero section with call to action button.`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          setPreviewImage(data.imageUrl);
          addLog("Preview image generated!");
        }
      }
    } catch {
      addLog("Preview image generation skipped (Gemini image API optional)");
    }
  };

  const getStepIcon = (step: BuildStep, index: number) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "running":
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Circle className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Rocket className="w-6 h-6 text-purple-500" />
          Build Progress
        </h2>
        {!isBuilding && idea && (
          <button
            onClick={startBuild}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Start Build
          </button>
        )}
      </div>

      {/* Step Progress */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${
              step.status === "running"
                ? "bg-blue-900/30 border border-blue-500/50"
                : step.status === "completed"
                ? "bg-green-900/20"
                : step.status === "failed"
                ? "bg-red-900/20"
                : "bg-gray-700/30"
            }`}
          >
            {/* Step number with icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              {getStepIcon(step, index)}
            </div>

            {/* Step details */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{step.name}</span>
                {step.status === "running" && (
                  <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">
                    In Progress
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">{step.description}</p>
            </div>

            {/* Step icon */}
            <div className="flex-shrink-0 text-gray-500">
              {step.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Connection line */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-700" />
        <div
          className="absolute left-5 top-0 w-0.5 bg-green-500 transition-all duration-500"
          style={{ height: `${(steps.filter(s => s.status === "completed").length / steps.length) * 100}%` }}
        />
      </div>

      {/* Preview Image */}
      {previewImage && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Preview</h3>
          <img
            src={previewImage}
            alt="App Preview"
            className="rounded-lg border border-gray-700 w-full max-w-md"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-5 h-5" />
            Build Error
          </div>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Live Logs */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Build Log
        </h3>
        <div className="bg-black rounded-lg p-3 font-mono text-xs text-green-400 h-32 overflow-y-auto">
          {logs.length === 0 ? (
            <span className="text-gray-500">Waiting to start...</span>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="leading-relaxed">{log}</div>
            ))
          )}
        </div>
      </div>

      {/* n8n Workflow Status */}
      <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">n8n Workflows</span>
          <a
            href="http://localhost:5678"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Open n8n Dashboard →
          </a>
        </div>
        <div className="mt-2 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-300">Content Generation</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-300">Opportunity Discovery</span>
          </div>
        </div>
      </div>
    </div>
  );
}
