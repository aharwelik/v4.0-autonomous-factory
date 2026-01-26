"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
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
    instructions: [
      "Go to Google AI Studio (link above)",
      "Sign in with Google account",
      "Click 'Create API Key'",
      "Copy and paste in .env file",
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
    instructions: [
      "Click Sign Up and create account",
      "Go to API Keys section",
      "Create new key, copy it",
      "Paste in your .env file",
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
    instructions: [
      "Sign up with GitHub (recommended)",
      "Go to Settings → Tokens",
      "Create new token",
      "Copy and paste in .env",
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
    instructions: [
      "Create account and new application",
      "Copy Publishable Key and Secret Key",
      "Add both to .env file",
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
    instructions: [
      "Sign up with GitHub",
      "Create new project",
      "Copy connection string",
      "Paste as DATABASE_URL in .env",
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
    instructions: [
      "Create account (test mode works without verification)",
      "Go to Developers → API Keys",
      "Copy Secret key and Publishable key",
      "Add to .env",
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
    instructions: [
      "Sign up and create project",
      "Copy Project API Key from settings",
      "Add to .env",
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
    instructions: [
      "Sign up and verify email",
      "Create API key",
      "Add to .env",
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
    instructions: [
      "Message @BotFather on Telegram",
      "Send /newbot and follow prompts",
      "Copy the token",
      "Add to .env",
    ],
  },
];

export function SetupGuide() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copyEnvTemplate = () => {
    const template = services
      .map((s) => `# ${s.name} - ${s.description}\n${s.envVar}=`)
      .join("\n\n");
    navigator.clipboard.writeText(template);
    setCopied("template");
    setTimeout(() => setCopied(null), 2000);
  };

  const openSignup = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="border-2 border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Quick Setup - Get All Free APIs</CardTitle>
          <Button variant="outline" size="sm" onClick={copyEnvTemplate} className="gap-2">
            {copied === "template" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy .env Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {services.map((service) => (
          <div
            key={service.name}
            className="border rounded-lg overflow-hidden"
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
                    {service.required ? (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    )}
                    {service.free && (
                      <Badge className="bg-green-600 text-xs">FREE</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openSignup(service.signupUrl);
                  }}
                  className="gap-1"
                >
                  Sign Up <ExternalLink className="w-3 h-3" />
                </Button>
                {expanded === service.name ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Expanded Instructions */}
            {expanded === service.name && (
              <div className="border-t p-3 bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {service.envVar}
                  </Badge>
                  <span className="text-sm text-green-600">{service.freeDetails}</span>
                </div>
                <ol className="text-sm space-y-1 ml-4">
                  {service.instructions.map((step, i) => (
                    <li key={i} className="list-decimal text-muted-foreground">
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSignup(service.docsUrl)}
                    className="gap-1 text-xs"
                  >
                    Docs <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Quick Commands */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">After adding keys to .env:</p>
          <div className="space-y-1 font-mono text-xs">
            <div className="flex items-center gap-2">
              <code className="bg-background px-2 py-1 rounded flex-1">
                ./scripts/health-check.sh
              </code>
              <span className="text-muted-foreground">← Verify all APIs work</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
