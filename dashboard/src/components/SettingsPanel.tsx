"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Play,
  Pause,
  Database,
  Zap,
  DollarSign,
  Bot,
  X,
} from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: () => void;
}

interface Settings {
  runInBackground: boolean;
  cacheEnabled: boolean;
  cacheTTL: number;
  budgetMonthly: number;
  budgetWarning: number;
  budgetCritical: number;
  parallelAgents: number;
  autoValidate: boolean;
}

export function SettingsPanel({ isOpen, onClose, onSettingsChange }: SettingsPanelProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof Settings, value: unknown) => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (response.ok) {
        setSettings({ ...settings, [key]: value });
        onSettingsChange?.();
      }
    } catch (error) {
      console.error("Failed to update setting:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Factory Settings
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading settings...
            </div>
          ) : settings ? (
            <>
              {/* Background Mode Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.runInBackground ? (
                      <Play className="w-4 h-4 text-green-500" />
                    ) : (
                      <Pause className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="font-medium">Run in Background</span>
                  </div>
                  <Button
                    variant={settings.runInBackground ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting("runInBackground", !settings.runInBackground)}
                    disabled={saving}
                  >
                    {settings.runInBackground ? "ON" : "OFF"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  When ON, agents run autonomously. When OFF, you approve each action.
                </p>
              </div>

              {/* Cache Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Enable Cache</span>
                  </div>
                  <Button
                    variant={settings.cacheEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting("cacheEnabled", !settings.cacheEnabled)}
                    disabled={saving}
                  >
                    {settings.cacheEnabled ? "ON" : "OFF"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cache API responses to reduce costs and improve speed.
                </p>
              </div>

              {/* Auto Validate Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">Auto-Validate Ideas</span>
                  </div>
                  <Button
                    variant={settings.autoValidate ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting("autoValidate", !settings.autoValidate)}
                    disabled={saving}
                  >
                    {settings.autoValidate ? "ON" : "OFF"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically run $10k feasibility check on new ideas.
                </p>
              </div>

              {/* Parallel Agents */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">Parallel Agents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 5].map((num) => (
                      <Button
                        key={num}
                        variant={settings.parallelAgents === num ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting("parallelAgents", num)}
                        disabled={saving}
                        className="w-8 h-8 p-0"
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Max agents running simultaneously. Lower = less cost, slower.
                </p>
              </div>

              {/* Monthly Budget */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Monthly Budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[25, 50, 100, 200].map((amount) => (
                      <Button
                        key={amount}
                        variant={settings.budgetMonthly === amount ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateSetting("budgetMonthly", amount)}
                        disabled={saving}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Agents pause when budget is reached. You&apos;ll be notified at 75%.
                </p>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Badge variant="outline" className="gap-1">
                  <Database className="w-3 h-3" />
                  SQLite Connected
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Zap className="w-3 h-3" />
                  Cache: {settings.cacheEnabled ? "Active" : "Disabled"}
                </Badge>
                <Badge
                  variant="outline"
                  className={`gap-1 ${
                    settings.runInBackground
                      ? "border-green-500 text-green-500"
                      : "border-yellow-500 text-yellow-500"
                  }`}
                >
                  {settings.runInBackground ? "Background Mode" : "Manual Mode"}
                </Badge>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-red-500">
              Failed to load settings
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
