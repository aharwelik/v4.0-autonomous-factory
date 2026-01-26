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
  Trash2,
  Brain,
  Globe,
  Bell,
  CreditCard,
  Users,
  BarChart,
  Info,
} from "lucide-react";

/**
 * SERVICE CATEGORIES - Group related services together
 * If one service in a category is configured, others become "optional"
 */
interface Service {
  id: string;
  name: string;
  category: "ai" | "hosting" | "auth" | "payments" | "notifications" | "analytics";
  purpose: string;           // One line: what this does
  whyNeeded: string;         // Why the factory needs this
  required: boolean;         // Is this category required?
  free: boolean;
  freeDetails: string;
  envVars: { key: string; label: string; placeholder: string; secret?: boolean }[];
  steps: string[];           // EXACT steps matching what user sees on the website
  signupUrl: string;
}

const CATEGORY_INFO: Record<string, { icon: React.ReactNode; title: string; description: string; required: boolean }> = {
  ai: {
    icon: <Brain className="w-5 h-5" />,
    title: "AI Provider",
    description: "The brain that validates your ideas and writes code. Pick ONE - you don't need all of them.",
    required: true,
  },
  hosting: {
    icon: <Globe className="w-5 h-5" />,
    title: "Hosting Provider",
    description: "Where your apps will be published online. Pick ONE - you don't need all of them.",
    required: true,
  },
  auth: {
    icon: <Users className="w-5 h-5" />,
    title: "User Authentication",
    description: "Lets users sign up and log in to your apps. Only needed if your app has user accounts.",
    required: false,
  },
  payments: {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Payments",
    description: "Accept money from customers. Only needed when you're ready to charge.",
    required: false,
  },
  notifications: {
    icon: <Bell className="w-5 h-5" />,
    title: "Notifications",
    description: "Get alerts when builds complete, apps deploy, or errors happen.",
    required: false,
  },
  analytics: {
    icon: <BarChart className="w-5 h-5" />,
    title: "Analytics",
    description: "Track how users interact with your apps.",
    required: false,
  },
};

const services: Service[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // AI PROVIDERS - Pick ONE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "gemini",
    name: "Google Gemini",
    category: "ai",
    purpose: "AI that validates ideas and writes code",
    whyNeeded: "The factory uses AI to check if your idea can make $10k/month, then writes all the code for your app.",
    required: true,
    free: true,
    freeDetails: "1 million tokens/day FREE - enough to build 10+ apps daily",
    envVars: [
      { key: "GEMINI_API_KEY", label: "API Key", placeholder: "AIzaSy...", secret: true }
    ],
    steps: [
      "Click 'Get Key' button below - opens Google AI Studio",
      "Sign in with your Google account (same as Gmail)",
      "Click the blue 'Create API Key' button",
      "Click 'Copy' on the key that appears",
      "Paste it below and click Save"
    ],
    signupUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    category: "ai",
    purpose: "Premium AI (alternative to Gemini)",
    whyNeeded: "Same as Gemini but some people prefer Claude's coding style. Costs money after free credit.",
    required: false,
    free: false,
    freeDetails: "$5 free credit when you sign up",
    envVars: [
      { key: "ANTHROPIC_API_KEY", label: "API Key", placeholder: "sk-ant-api03-...", secret: true }
    ],
    steps: [
      "Click 'Get Key' - opens Anthropic console",
      "Create account with email",
      "Go to 'API Keys' in left sidebar",
      "Click 'Create Key'",
      "Copy the key and paste below"
    ],
    signupUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "ai",
    purpose: "ChatGPT's AI (alternative to Gemini)",
    whyNeeded: "Another AI option. Costs money but very reliable.",
    required: false,
    free: false,
    freeDetails: "Pay as you go - ~$0.01 per build",
    envVars: [
      { key: "OPENAI_API_KEY", label: "API Key", placeholder: "sk-...", secret: true }
    ],
    steps: [
      "Click 'Get Key' - opens OpenAI platform",
      "Sign in or create account",
      "Click 'API Keys' in left menu",
      "Click 'Create new secret key'",
      "Copy and paste below"
    ],
    signupUrl: "https://platform.openai.com/api-keys",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOSTING PROVIDERS - Pick ONE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "vercel",
    name: "Vercel",
    category: "hosting",
    purpose: "Publish your apps online with one click",
    whyNeeded: "After the AI builds your app, you need somewhere to put it so people can use it. Vercel is the easiest option.",
    required: true,
    free: true,
    freeDetails: "Unlimited deploys FREE for personal projects",
    envVars: [
      { key: "VERCEL_TOKEN", label: "Token", placeholder: "your_vercel_token", secret: true }
    ],
    steps: [
      "Click 'Get Key' below - opens Vercel Tokens page",
      "Sign up with GitHub (easiest) or email if you don't have an account",
      "⚠️ IMPORTANT: Vercel will show you setup instructions, code snippets, framework selection, etc.",
      "❌ IGNORE ALL OF THAT - you don't need any of it!",
      "✅ Just look for 'Create' or 'Create Token' button",
      "Give it any name (like 'app-factory')",
      "Copy the token that appears (starts with a bunch of random letters)",
      "Paste it below and click Save - that's all you need!"
    ],
    signupUrl: "https://vercel.com/account/tokens",
  },
  {
    id: "hostinger",
    name: "Hostinger",
    category: "hosting",
    purpose: "Traditional web hosting (if you have Hostinger account)",
    whyNeeded: "Alternative to Vercel. Use this if you already pay for Hostinger hosting.",
    required: false,
    free: false,
    freeDetails: "$3-12/month depending on plan",
    envVars: [
      { key: "HOSTINGER_GIT_URL", label: "Git Deploy URL", placeholder: "git@github.com:user/repo.git", secret: false },
      { key: "HOSTINGER_FTP_HOST", label: "FTP Host (alternative)", placeholder: "ftp.yourdomain.com", secret: false },
      { key: "HOSTINGER_FTP_USER", label: "FTP Username", placeholder: "your-ftp-user", secret: false },
      { key: "HOSTINGER_FTP_PASS", label: "FTP Password", placeholder: "your-ftp-password", secret: true },
    ],
    steps: [
      "Log in to Hostinger hPanel",
      "Click 'Websites' → Select your site",
      "For Git Deploy: Click 'Git' → Copy the URL",
      "For FTP: Click 'FTP Accounts' → Copy credentials",
      "Enter the details below"
    ],
    signupUrl: "https://hpanel.hostinger.com",
  },
  {
    id: "railway",
    name: "Railway",
    category: "hosting",
    purpose: "Full-stack app hosting (alternative to Vercel)",
    whyNeeded: "Good for apps that need a database. Has a free trial.",
    required: false,
    free: false,
    freeDetails: "$5/month minimum after free trial",
    envVars: [
      { key: "RAILWAY_TOKEN", label: "Token", placeholder: "your_railway_token", secret: true }
    ],
    steps: [
      "Click 'Get Key' - opens Railway",
      "Sign up with GitHub",
      "Click your profile → Account Settings",
      "Click 'Tokens' tab",
      "Click 'Create Token'",
      "Copy and paste below"
    ],
    signupUrl: "https://railway.app/account/tokens",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION - Only if your app needs user logins
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "clerk",
    name: "Clerk",
    category: "auth",
    purpose: "Add user signup/login to your apps",
    whyNeeded: "If your app needs users to create accounts and log in. Skip this for simple tools without accounts.",
    required: false,
    free: true,
    freeDetails: "10,000 monthly users FREE",
    envVars: [
      { key: "CLERK_PUBLISHABLE_KEY", label: "Publishable Key (starts with pk_)", placeholder: "pk_test_...", secret: false },
      { key: "CLERK_SECRET_KEY", label: "Secret Key (starts with sk_)", placeholder: "sk_test_...", secret: true },
    ],
    steps: [
      "Click 'Get Key' - opens Clerk dashboard",
      "Sign up with email or Google",
      "You'll see 'Create Application' - just type any name and click Create",
      "On the next page, ignore the code - just look for:",
      "  → 'Publishable key' (starts with pk_test_) - copy it",
      "  → 'Secret key' - click to reveal, then copy it",
      "Paste BOTH keys below",
      "That's it! Ignore all the other setup instructions on Clerk."
    ],
    signupUrl: "https://dashboard.clerk.com/sign-up",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENTS - Only when ready to charge customers
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "stripe",
    name: "Stripe",
    category: "payments",
    purpose: "Accept credit card payments",
    whyNeeded: "When you're ready to charge customers. Skip this until you have a working app.",
    required: false,
    free: true,
    freeDetails: "No monthly fee - only 2.9% + $0.30 per transaction",
    envVars: [
      { key: "STRIPE_PUBLISHABLE_KEY", label: "Publishable Key (starts with pk_)", placeholder: "pk_test_...", secret: false },
      { key: "STRIPE_SECRET_KEY", label: "Secret Key (starts with sk_)", placeholder: "sk_test_...", secret: true },
    ],
    steps: [
      "Click 'Get Key' - opens Stripe",
      "Create account (need email + business info)",
      "Click 'Developers' in top menu",
      "Click 'API Keys'",
      "Copy 'Publishable key' and 'Secret key'",
      "Paste both below"
    ],
    signupUrl: "https://dashboard.stripe.com/register",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "telegram",
    name: "Telegram Bot",
    category: "notifications",
    purpose: "Get alerts on your phone when builds complete",
    whyNeeded: "Optional but nice - tells you when your app is done building or if something fails.",
    required: false,
    free: true,
    freeDetails: "Completely free, unlimited messages",
    envVars: [
      { key: "TELEGRAM_BOT_TOKEN", label: "Bot Token", placeholder: "123456789:ABC...", secret: true },
      { key: "TELEGRAM_CHAT_ID", label: "Chat ID (your user ID)", placeholder: "123456789", secret: false },
    ],
    steps: [
      "Open Telegram app on your phone",
      "Search for @BotFather and open chat",
      "Send: /newbot",
      "Follow prompts to name your bot",
      "Copy the token it gives you (looks like 123456:ABC...)",
      "To get your Chat ID: search @userinfobot, send any message, it replies with your ID",
      "Paste both below"
    ],
    signupUrl: "https://t.me/BotFather",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "posthog",
    name: "PostHog",
    category: "analytics",
    purpose: "Track how users use your apps",
    whyNeeded: "See what pages users visit, where they click, session recordings. Skip until you have users.",
    required: false,
    free: true,
    freeDetails: "1 million events/month FREE",
    envVars: [
      { key: "POSTHOG_API_KEY", label: "Project API Key", placeholder: "phc_...", secret: true },
    ],
    steps: [
      "Click 'Get Key' - opens PostHog",
      "Sign up with email or Google",
      "Create a project (any name)",
      "Go to Settings → Project → Project API Key",
      "Copy and paste below"
    ],
    signupUrl: "https://app.posthog.com/signup",
  },
];

interface SetupGuideProps {
  onKeySaved?: () => void;
}

export function SetupGuide({ onKeySaved }: SetupGuideProps = {}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Load saved keys on mount
  useEffect(() => {
    const loadKeys = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          const keys: Record<string, string> = {};
          services.forEach((service) => {
            service.envVars.forEach((env) => {
              if (data[env.key]) {
                keys[env.key] = data[env.key];
              }
            });
          });
          setSavedKeys(keys);
        }
      } catch {
        // Silently fail
      }
    };
    loadKeys();
  }, []);

  // Check if a category has at least one service configured
  const isCategoryConfigured = (category: string) => {
    return services
      .filter((s) => s.category === category)
      .some((s) => s.envVars.every((env) => savedKeys[env.key]));
  };

  // Check if a specific service is fully configured
  const isServiceConfigured = (service: Service) => {
    return service.envVars.every((env) => savedKeys[env.key]);
  };

  // Should this service be grayed out? (another in same category is configured)
  const shouldGrayOut = (service: Service) => {
    if (isServiceConfigured(service)) return false; // Don't gray out if this one is configured
    return isCategoryConfigured(service.category); // Gray out if another in category is configured
  };

  // Save keys for a service
  const saveKeys = async (service: Service) => {
    const keysToSave: Record<string, string> = {};
    let allFilled = true;

    service.envVars.forEach((env) => {
      const value = inputValues[env.key]?.trim();
      if (value) {
        keysToSave[env.key] = value;
      } else if (!savedKeys[env.key]) {
        allFilled = false;
      }
    });

    if (!allFilled && Object.keys(keysToSave).length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(service.id);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keysToSave),
      });

      if (response.ok) {
        setSavedKeys((prev) => ({ ...prev, ...keysToSave }));
        setInputValues((prev) => {
          const next = { ...prev };
          Object.keys(keysToSave).forEach((k) => delete next[k]);
          return next;
        });
        onKeySaved?.();
      }
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(null);
    }
  };

  // Delete all keys for a service
  const deleteKeys = async (service: Service) => {
    if (!confirm(`Delete all ${service.name} keys? You'll need to add them again.`)) return;

    try {
      for (const env of service.envVars) {
        await fetch("/api/settings/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: env.key }),
        });
      }

      setSavedKeys((prev) => {
        const next = { ...prev };
        service.envVars.forEach((env) => delete next[env.key]);
        return next;
      });
      onKeySaved?.();
    } catch {
      alert("Failed to delete");
    }
  };

  // Group services by category
  const categories = Object.keys(CATEGORY_INFO) as Array<keyof typeof CATEGORY_INFO>;

  // Count configured
  const requiredCategories = categories.filter((c) => CATEGORY_INFO[c].required);
  const configuredRequired = requiredCategories.filter((c) => isCategoryConfigured(c)).length;

  return (
    <Card id="quick-setup" className="border-2 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Quick Setup</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {configuredRequired}/{requiredCategories.length} required categories configured
            </p>
          </div>
          {configuredRequired === requiredCategories.length ? (
            <Badge className="bg-green-600">Ready to Build!</Badge>
          ) : (
            <Badge variant="destructive">Setup Incomplete</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {categories.map((category) => {
          const info = CATEGORY_INFO[category];
          const categoryServices = services.filter((s) => s.category === category);
          const isConfigured = isCategoryConfigured(category);

          return (
            <div key={category} className="space-y-3">
              {/* Category Header */}
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                isConfigured ? "bg-green-950/30" : info.required ? "bg-red-950/20" : "bg-muted/30"
              }`}>
                <div className={isConfigured ? "text-green-500" : info.required ? "text-red-400" : "text-muted-foreground"}>
                  {info.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{info.title}</span>
                    {isConfigured ? (
                      <Badge className="bg-green-600 text-xs">✓ Done</Badge>
                    ) : info.required ? (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </div>
              </div>

              {/* Services in this category */}
              <div className="space-y-2 ml-4">
                {categoryServices.map((service) => {
                  const configured = isServiceConfigured(service);
                  const grayedOut = shouldGrayOut(service);

                  return (
                    <div
                      key={service.id}
                      className={`border rounded-lg overflow-hidden transition-opacity ${
                        configured ? "border-green-600/50" : grayedOut ? "opacity-50" : ""
                      }`}
                    >
                      {/* Service Header */}
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpanded(expanded === service.id ? null : service.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{service.name}</span>
                            {configured && <Badge className="bg-green-600 text-xs">✓ Configured</Badge>}
                            {service.free && !configured && <Badge className="bg-blue-600 text-xs">FREE</Badge>}
                            {grayedOut && <Badge variant="secondary" className="text-xs">Alternative</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{service.purpose}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!configured && !grayedOut && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(service.signupUrl, "_blank");
                                setExpanded(service.id);
                              }}
                            >
                              Get Key <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                          {expanded === service.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Setup Instructions */}
                      {expanded === service.id && (
                        <div className="border-t p-4 bg-muted/30 space-y-4">
                          {/* Why you need this */}
                          <div className="bg-blue-950/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-blue-400 mb-1">
                              <Info className="w-4 h-4" />
                              <span className="font-medium text-sm">Why you need this:</span>
                            </div>
                            <p className="text-sm text-blue-200">{service.whyNeeded}</p>
                          </div>

                          {/* Free tier info */}
                          <p className="text-sm text-green-500">{service.freeDetails}</p>

                          {/* Step by step instructions */}
                          <div>
                            <p className="text-sm font-medium mb-2">Step-by-step:</p>
                            <ol className="text-sm space-y-1 ml-4">
                              {service.steps.map((step, i) => (
                                <li key={i} className="list-decimal text-muted-foreground">
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>

                          {/* Input fields */}
                          <div className="space-y-3">
                            {service.envVars.map((env) => (
                              <div key={env.key}>
                                <label className="text-sm font-medium mb-1 block">
                                  {env.label}
                                  {savedKeys[env.key] && (
                                    <span className="text-green-500 ml-2">✓ Saved</span>
                                  )}
                                </label>
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <Input
                                      type={env.secret && !showSecrets[env.key] ? "password" : "text"}
                                      placeholder={savedKeys[env.key] ? "••••••• (saved)" : env.placeholder}
                                      value={inputValues[env.key] || ""}
                                      onChange={(e) =>
                                        setInputValues((prev) => ({
                                          ...prev,
                                          [env.key]: e.target.value,
                                        }))
                                      }
                                      className="font-mono text-sm pr-10"
                                    />
                                    {env.secret && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setShowSecrets((prev) => ({
                                            ...prev,
                                            [env.key]: !prev[env.key],
                                          }))
                                        }
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                                      >
                                        {showSecrets[env.key] ? (
                                          <EyeOff className="w-4 h-4" />
                                        ) : (
                                          <Eye className="w-4 h-4" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <Button
                              onClick={() => saveKeys(service)}
                              disabled={saving === service.id}
                              className="gap-2"
                            >
                              {saving === service.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4" />
                                  Save
                                </>
                              )}
                            </Button>
                            {configured && (
                              <Button
                                variant="destructive"
                                onClick={() => deleteKeys(service)}
                                className="gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
