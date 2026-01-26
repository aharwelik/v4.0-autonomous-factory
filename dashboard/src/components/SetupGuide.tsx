"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ExternalLink,
  Check,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

interface Service {
  name: string;
  description: string;
  signupUrl: string;
  docsUrl: string;
  envVar: string;
  free: boolean;
  freeDetails: string;
  required: boolean;
  instructions: string[];
  placeholder: string;
}

const services: Service[] = [
  {
    name: "Google Gemini (FREE!)",
    description: "AI for everything - RECOMMENDED",
    signupUrl: "https://aistudio.google.com/app/apikey",
    docsUrl: "https://ai.google.dev/docs",
    envVar: "GEMINI_API_KEY",
    free: true,
    freeDetails: "1M tokens/day, 1500 requests/day FREE",
    required: true,
    placeholder: "AIzaSy...",
    instructions: [
      "Go to Google AI Studio (link above)",
      "Sign in with Google account",
      "Click 'Create API Key'",
      "Paste below and click Save",
    ],
  },
  {
    name: "Anthropic (Claude)",
    description: "Alternative AI (optional if using Gemini)",
    signupUrl: "https://console.anthropic.com/signup",
    docsUrl: "https://docs.anthropic.com",
    envVar: "ANTHROPIC_API_KEY",
    free: false,
    freeDetails: "$5 free credit on signup",
    required: false,
    placeholder: "sk-ant-api03-...",
    instructions: [
      "Click Sign Up and create account",
      "Go to API Keys section",
      "Create new key",
      "Paste below and click Save",
    ],
  },
  {
    name: "Vercel",
    description: "Deploy apps with one click",
    signupUrl: "https://vercel.com/signup",
    docsUrl: "https://vercel.com/docs",
    envVar: "VERCEL_TOKEN",
    free: true,
    freeDetails: "Unlimited deploys, 100GB bandwidth",
    required: true,
    placeholder: "your_vercel_token",
    instructions: [
      "Sign up with GitHub (recommended)",
      "Go to Settings → Tokens",
      "Create new token",
      "Paste below and click Save",
    ],
  },
  {
    name: "Clerk",
    description: "User authentication",
    signupUrl: "https://dashboard.clerk.com/sign-up",
    docsUrl: "https://clerk.com/docs",
    envVar: "CLERK_SECRET_KEY",
    free: true,
    freeDetails: "10,000 monthly active users free",
    required: true,
    placeholder: "sk_test_...",
    instructions: [
      "Create account and new application",
      "Copy Secret Key",
      "Paste below and click Save",
    ],
  },
  {
    name: "Neon",
    description: "Serverless PostgreSQL database",
    signupUrl: "https://console.neon.tech/signup",
    docsUrl: "https://neon.tech/docs",
    envVar: "DATABASE_URL",
    free: true,
    freeDetails: "512MB storage, unlimited databases",
    required: true,
    placeholder: "postgresql://...",
    instructions: [
      "Sign up with GitHub",
      "Create new project",
      "Copy connection string",
      "Paste below and click Save",
    ],
  },
  {
    name: "Stripe",
    description: "Accept payments",
    signupUrl: "https://dashboard.stripe.com/register",
    docsUrl: "https://stripe.com/docs",
    envVar: "STRIPE_SECRET_KEY",
    free: true,
    freeDetails: "No monthly fee, 2.9% + 30¢ per transaction",
    required: false,
    placeholder: "sk_test_...",
    instructions: [
      "Create account (test mode works without verification)",
      "Go to Developers → API Keys",
      "Copy Secret key",
      "Paste below and click Save",
    ],
  },
  {
    name: "PostHog",
    description: "Product analytics and session replay",
    signupUrl: "https://app.posthog.com/signup",
    docsUrl: "https://posthog.com/docs",
    envVar: "POSTHOG_API_KEY",
    free: true,
    freeDetails: "1 million events/month free",
    required: false,
    placeholder: "phc_...",
    instructions: [
      "Sign up and create project",
      "Copy Project API Key from settings",
      "Paste below and click Save",
    ],
  },
  {
    name: "Resend",
    description: "Transactional emails",
    signupUrl: "https://resend.com/signup",
    docsUrl: "https://resend.com/docs",
    envVar: "RESEND_API_KEY",
    free: true,
    freeDetails: "100 emails/day free, 3,000/month",
    required: false,
    placeholder: "re_...",
    instructions: [
      "Sign up and verify email",
      "Create API key",
      "Paste below and click Save",
    ],
  },
  {
    name: "Telegram Bot",
    description: "Get alerts and notifications",
    signupUrl: "https://t.me/BotFather",
    docsUrl: "https://core.telegram.org/bots",
    envVar: "TELEGRAM_BOT_TOKEN",
    free: true,
    freeDetails: "Completely free, unlimited",
    required: false,
    placeholder: "123456789:ABC...",
    instructions: [
      "Message @BotFather on Telegram",
      "Send /newbot and follow prompts",
      "Copy the token",
      "Paste below and click Save",
    ],
  },
  {
    name: "Hostinger",
    description: "Deploy to your Hostinger hosting",
    signupUrl: "https://www.hostinger.com",
    docsUrl: "https://support.hostinger.com",
    envVar: "HOSTINGER_GIT_URL",
    free: false,
    freeDetails: "$3-12/month hosting",
    required: false,
    placeholder: "git@github.com:user/repo.git or FTP host",
    instructions: [
      "Log in to Hostinger hPanel",
      "Go to Websites → Your Site → Git",
      "Copy the Git URL (or FTP details)",
      "Paste below and click Save",
    ],
  },
];

interface SetupGuideProps {
  onKeySaved?: () => void;
}

export function SetupGuide({ onKeySaved }: SetupGuideProps = {}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [validating, setValidating] = useState<string | null>(null);
  const [validated, setValidated] = useState<Record<string, boolean | null>>({});

  // Load saved keys on mount
  useEffect(() => {
    const loadKeys = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          const keys: Record<string, string> = {};
          const saved: Record<string, boolean> = {};

          services.forEach((service) => {
            if (data[service.envVar]) {
              keys[service.envVar] = data[service.envVar];
              saved[service.envVar] = true;
            }
          });

          setApiKeys(keys);
          setSavedKeys(saved);
        }
      } catch {
        // Silently fail
      }
    };
    loadKeys();
  }, []);

  const saveKey = async (service: Service) => {
    const key = apiKeys[service.envVar];
    if (!key?.trim()) return;

    setSaving(service.envVar);
    setValidating(service.envVar);

    try {
      // First validate the key
      const isValid = await validateKey(service, key);
      setValidated((prev) => ({ ...prev, [service.envVar]: isValid }));

      if (!isValid) {
        setSaving(null);
        setValidating(null);
        return;
      }

      // Save to backend
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [service.envVar]: key }),
      });

      if (response.ok) {
        setSavedKeys((prev) => ({ ...prev, [service.envVar]: true }));
        // Notify parent to refresh preflight status
        onKeySaved?.();
      }
    } catch {
      setValidated((prev) => ({ ...prev, [service.envVar]: false }));
    } finally {
      setSaving(null);
      setValidating(null);
    }
  };

  const validateKey = async (service: Service, key: string): Promise<boolean> => {
    try {
      switch (service.envVar) {
        case "GEMINI_API_KEY": {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1/models?key=${key}`
          );
          return res.ok;
        }
        case "ANTHROPIC_API_KEY": {
          // Can't validate from browser due to CORS, assume valid if format matches
          return key.startsWith("sk-ant-");
        }
        case "VERCEL_TOKEN": {
          // Can't validate from browser due to CORS, assume valid if non-empty
          return key.length > 10;
        }
        case "TELEGRAM_BOT_TOKEN": {
          const res = await fetch(`https://api.telegram.org/bot${key}/getMe`);
          return res.ok;
        }
        default:
          // For others, just check it's not empty
          return key.length > 5;
      }
    } catch {
      return false;
    }
  };

  const openSignup = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getStatusBadge = (service: Service) => {
    if (savedKeys[service.envVar]) {
      return <Badge className="bg-green-600 text-xs">✓ Configured</Badge>;
    }
    if (service.required) {
      return <Badge variant="destructive" className="text-xs">Required</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Optional</Badge>;
  };

  const configuredCount = Object.values(savedKeys).filter(Boolean).length;
  const requiredCount = services.filter((s) => s.required).length;
  const requiredConfigured = services.filter(
    (s) => s.required && savedKeys[s.envVar]
  ).length;

  return (
    <Card className="border-2 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Quick Setup</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {configuredCount} of {services.length} configured ({requiredConfigured}/{requiredCount} required)
            </p>
          </div>
          {requiredConfigured === requiredCount && (
            <Badge className="bg-green-600">Ready to Build!</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {services.map((service) => (
          <div
            key={service.name}
            className={`border rounded-lg overflow-hidden ${
              savedKeys[service.envVar] ? "border-green-600/50" : ""
            }`}
          >
            {/* Service Header */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
              onClick={() => setExpanded(expanded === service.name ? null : service.name)}
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{service.name}</span>
                    {getStatusBadge(service)}
                    {service.free && !savedKeys[service.envVar] && (
                      <Badge className="bg-green-600 text-xs">FREE</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!savedKeys[service.envVar] && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openSignup(service.signupUrl);
                      setExpanded(service.name);
                    }}
                    className="gap-1"
                  >
                    Get Key <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
                {expanded === service.name ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Expanded Section with Key Input */}
            {expanded === service.name && (
              <div className="border-t p-3 bg-muted/30 space-y-3">
                {/* Instructions */}
                <div>
                  <p className="text-sm text-green-600 mb-2">{service.freeDetails}</p>
                  <ol className="text-sm space-y-1 ml-4">
                    {service.instructions.map((step, i) => (
                      <li key={i} className="list-decimal text-muted-foreground">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* API Key Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKey[service.envVar] ? "text" : "password"}
                      placeholder={service.placeholder}
                      value={apiKeys[service.envVar] || ""}
                      onChange={(e) => {
                        setApiKeys((prev) => ({
                          ...prev,
                          [service.envVar]: e.target.value,
                        }));
                        setValidated((prev) => ({
                          ...prev,
                          [service.envVar]: null,
                        }));
                        setSavedKeys((prev) => ({
                          ...prev,
                          [service.envVar]: false,
                        }));
                      }}
                      className={`pr-10 font-mono text-sm ${
                        validated[service.envVar] === false
                          ? "border-red-500"
                          : validated[service.envVar] === true
                          ? "border-green-500"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowKey((prev) => ({
                          ...prev,
                          [service.envVar]: !prev[service.envVar],
                        }))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey[service.envVar] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    onClick={() => saveKey(service)}
                    disabled={
                      saving === service.envVar ||
                      !apiKeys[service.envVar]?.trim()
                    }
                    className="gap-2"
                  >
                    {saving === service.envVar ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {validating ? "Validating..." : "Saving..."}
                      </>
                    ) : savedKeys[service.envVar] ? (
                      <>
                        <Check className="w-4 h-4" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>

                {/* Validation feedback */}
                {validated[service.envVar] === false && (
                  <p className="text-sm text-red-500">
                    Invalid key. Please check and try again.
                  </p>
                )}
                {validated[service.envVar] === true && (
                  <p className="text-sm text-green-500">
                    ✓ Key validated and saved!
                  </p>
                )}

                {/* Docs link */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSignup(service.docsUrl)}
                    className="gap-1 text-xs"
                  >
                    Docs <ExternalLink className="w-3 h-3" />
                  </Button>
                  {!savedKeys[service.envVar] && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSignup(service.signupUrl)}
                      className="gap-1 text-xs"
                    >
                      Sign Up <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Status Summary */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Status:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={requiredConfigured === requiredCount ? "text-green-500" : "text-yellow-500"}>
                {requiredConfigured === requiredCount ? "✓" : "○"}
              </span>
              <span>Required: {requiredConfigured}/{requiredCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">○</span>
              <span>Optional: {configuredCount - requiredConfigured}/{services.length - requiredCount}</span>
            </div>
          </div>
          {requiredConfigured === requiredCount && (
            <p className="text-sm text-green-500 mt-2">
              🎉 All required services configured! You can start building apps.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
