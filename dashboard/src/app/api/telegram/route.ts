import { NextRequest, NextResponse } from "next/server";
import { settings } from "@/lib/db";

/**
 * Telegram Notifications API
 * Sends messages to configured Telegram bot
 */

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

const NOTIFICATION_EMOJIS: Record<string, string> = {
  idea: "💡",
  build_start: "🏗️",
  build_complete: "✅",
  deployment: "🚀",
  revenue: "💰",
  error: "❌",
  info: "ℹ️",
};

const NOTIFICATION_KEY_MAP: Record<string, keyof TelegramConfig> = {
  idea: "notifyOnNewIdea",
  build_start: "notifyOnBuildStart",
  build_complete: "notifyOnBuildComplete",
  deployment: "notifyOnDeployment",
  revenue: "notifyOnRevenue",
};

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  }
}

// GET: Retrieve saved Telegram configuration
export async function GET() {
  const config = settings.get<TelegramConfig>("telegram_config");

  if (!config) {
    return NextResponse.json({
      config: null,
      message: "No Telegram configuration found",
    });
  }

  // Don't expose the full bot token in responses
  const safeConfig = {
    ...config,
    botToken: config.botToken ? "***configured***" : "",
  };

  return NextResponse.json({
    config: safeConfig,
    realConfig: config, // Include real config for internal use
  });
}

// POST: Save config, send test message, or send notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "save": {
        // Save Telegram configuration
        const { config } = body as { config: TelegramConfig };

        if (!config) {
          return NextResponse.json(
            { success: false, error: "Config required" },
            { status: 400 }
          );
        }

        settings.set("telegram_config", config);

        return NextResponse.json({
          success: true,
          message: "Telegram configuration saved",
        });
      }

      case "test": {
        // Send test message
        const { botToken, chatId } = body;

        if (!botToken || !chatId) {
          return NextResponse.json(
            { success: false, error: "Bot token and chat ID required" },
            { status: 400 }
          );
        }

        const testMessage = `🏭 <b>App Factory Connected!</b>

This is a test message from your Autonomous App Factory dashboard.

If you see this, notifications are working correctly.

<i>Sent at: ${new Date().toLocaleString()}</i>`;

        const success = await sendTelegramMessage(botToken, chatId, testMessage);

        if (success) {
          return NextResponse.json({
            success: true,
            message: "Test message sent successfully",
          });
        } else {
          return NextResponse.json(
            { success: false, error: "Failed to send message. Check credentials." },
            { status: 400 }
          );
        }
      }

      case "notify": {
        // Send notification (used by other parts of the app)
        const { type, message } = body;

        const config = settings.get<TelegramConfig>("telegram_config");

        if (!config || !config.enabled) {
          return NextResponse.json({
            success: false,
            error: "Telegram notifications not enabled",
          });
        }

        // Check if this notification type is enabled
        const configKey = NOTIFICATION_KEY_MAP[type];
        if (configKey && !config[configKey]) {
          return NextResponse.json({
            success: false,
            error: `Notification type '${type}' is disabled`,
          });
        }

        const emoji = NOTIFICATION_EMOJIS[type] || "📢";
        const formattedMessage = `${emoji} <b>App Factory</b>

${message}

<i>${new Date().toLocaleString()}</i>`;

        const success = await sendTelegramMessage(
          config.botToken,
          config.chatId,
          formattedMessage
        );

        return NextResponse.json({ success });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Telegram API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
