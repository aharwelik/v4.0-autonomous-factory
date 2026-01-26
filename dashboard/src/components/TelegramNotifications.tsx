"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Send,
  Check,
  AlertCircle,
  Bell,
  MessageSquare,
  ExternalLink,
} from "lucide-react";

interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  notifyOnNewIdea: boolean;
  notifyOnBuildStart: boolean;
  notifyOnBuildComplete: boolean;
  notifyOnDeployment: boolean;
  notifyOnRevenue: boolean;
}

export function TelegramNotifications() {
  const [config, setConfig] = useState<TelegramConfig>({
    botToken: "",
    chatId: "",
    enabled: false,
    notifyOnNewIdea: true,
    notifyOnBuildStart: true,
    notifyOnBuildComplete: true,
    notifyOnDeployment: true,
    notifyOnRevenue: true,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [saving, setSaving] = useState(false);

  // Load saved config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/telegram");
        if (response.ok) {
          const data = await response.json();
          if (data.config) {
            setConfig(data.config);
          }
        }
      } catch {
        // Silently fail - use defaults
      }
    };
    loadConfig();
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    try {
      await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", config }),
      });
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  };

  const sendTestMessage = async () => {
    if (!config.botToken || !config.chatId) {
      setTestResult("error");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          botToken: config.botToken,
          chatId: config.chatId,
        }),
      });

      if (response.ok) {
        setTestResult("success");
        // Auto-save config after successful test
        await saveConfig();
      } else {
        setTestResult("error");
      }
    } catch {
      setTestResult("error");
    } finally {
      setTesting(false);
    }
  };

  const updateConfig = (key: keyof TelegramConfig, value: boolean | string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Telegram Notifications
          </CardTitle>
          <Badge variant={config.enabled ? "default" : "secondary"}>
            {config.enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Get instant alerts when things happen in your factory
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Setup Instructions */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <p className="font-medium mb-2">Quick Setup:</p>
          <ol className="list-decimal ml-4 space-y-1 text-muted-foreground">
            <li>
              Message{" "}
              <Button
                variant="link"
                className="h-auto p-0 text-blue-500"
                onClick={() => window.open("https://t.me/BotFather", "_blank")}
              >
                @BotFather <ExternalLink className="w-3 h-3 ml-1" />
              </Button>{" "}
              on Telegram
            </li>
            <li>Send /newbot and follow the prompts</li>
            <li>Copy the bot token and paste below</li>
            <li>
              Message{" "}
              <Button
                variant="link"
                className="h-auto p-0 text-blue-500"
                onClick={() => window.open("https://t.me/userinfobot", "_blank")}
              >
                @userinfobot <ExternalLink className="w-3 h-3 ml-1" />
              </Button>{" "}
              to get your Chat ID
            </li>
          </ol>
        </div>

        {/* Bot Token */}
        <div className="space-y-2">
          <Label htmlFor="botToken">Bot Token</Label>
          <Input
            id="botToken"
            type="password"
            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            value={config.botToken}
            onChange={(e) => updateConfig("botToken", e.target.value)}
          />
        </div>

        {/* Chat ID */}
        <div className="space-y-2">
          <Label htmlFor="chatId">Chat ID</Label>
          <Input
            id="chatId"
            placeholder="123456789"
            value={config.chatId}
            onChange={(e) => updateConfig("chatId", e.target.value)}
          />
        </div>

        {/* Test Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={sendTestMessage}
            disabled={testing || !config.botToken || !config.chatId}
            className="gap-2"
          >
            <Send className={`w-4 h-4 ${testing ? "animate-pulse" : ""}`} />
            {testing ? "Sending..." : "Send Test Message"}
          </Button>
          {testResult === "success" && (
            <span className="flex items-center gap-1 text-green-500 text-sm">
              <Check className="w-4 h-4" /> Message sent!
            </span>
          )}
          {testResult === "error" && (
            <span className="flex items-center gap-1 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" /> Failed - check credentials
            </span>
          )}
        </div>

        {/* Enable/Disable */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <Label htmlFor="enabled">Enable Notifications</Label>
          </div>
          <Switch
            id="enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => {
              updateConfig("enabled", checked);
              saveConfig();
            }}
            disabled={!config.botToken || !config.chatId}
          />
        </div>

        {/* Notification Types */}
        {config.enabled && (
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium">Notify me when:</p>

            <div className="space-y-2">
              {[
                { key: "notifyOnNewIdea", label: "New idea discovered", emoji: "💡" },
                { key: "notifyOnBuildStart", label: "Build starts", emoji: "🏗️" },
                { key: "notifyOnBuildComplete", label: "Build completes", emoji: "✅" },
                { key: "notifyOnDeployment", label: "App deployed", emoji: "🚀" },
                { key: "notifyOnRevenue", label: "Revenue received", emoji: "💰" },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-muted-foreground">
                    {item.emoji} {item.label}
                  </span>
                  <Switch
                    checked={config[item.key as keyof TelegramConfig] as boolean}
                    onCheckedChange={(checked) => {
                      updateConfig(item.key as keyof TelegramConfig, checked);
                      saveConfig();
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Utility function to send Telegram notifications from anywhere in the app
 */
export async function sendTelegramNotification(
  type: "idea" | "build_start" | "build_complete" | "deployment" | "revenue",
  message: string
): Promise<boolean> {
  try {
    const response = await fetch("/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "notify", type, message }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
