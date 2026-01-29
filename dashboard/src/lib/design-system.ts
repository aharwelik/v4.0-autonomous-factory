/**
 * Design System - Single source of truth for UI consistency
 * Use these constants instead of hardcoding colors/styles
 */

import { CheckCircle, XCircle, Clock, Loader, Rocket, Hammer, Bot } from "lucide-react";

// Status Colors & Badges
export const STATUS_STYLES = {
  // Build/Job Statuses
  validated: {
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    text: "text-emerald-500",
    bg: "bg-emerald-500",
    icon: CheckCircle,
  },
  building: {
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    text: "text-blue-500",
    bg: "bg-blue-500",
    icon: Hammer,
  },
  completed: {
    badge: "bg-green-500/10 text-green-500 border-green-500/20",
    text: "text-green-500",
    bg: "bg-green-500",
    icon: CheckCircle,
  },
  failed: {
    badge: "bg-red-500/10 text-red-500 border-red-500/20",
    text: "text-red-500",
    bg: "bg-red-500",
    icon: XCircle,
  },
  queued: {
    badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    text: "text-yellow-500",
    bg: "bg-yellow-500",
    icon: Clock,
  },
  running: {
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse",
    text: "text-blue-500",
    bg: "bg-blue-500",
    icon: Loader,
  },
  deployed: {
    badge: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    text: "text-purple-500",
    bg: "bg-purple-500",
    icon: Rocket,
  },
  pending: {
    badge: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    text: "text-gray-500",
    bg: "bg-gray-500",
    icon: Clock,
  },
} as const;

// Get status style
export function getStatusStyle(status: string) {
  const normalized = status.toLowerCase() as keyof typeof STATUS_STYLES;
  return STATUS_STYLES[normalized] || STATUS_STYLES.pending;
}

// Cost thresholds
export const COST_THRESHOLDS = {
  daily: {
    low: 0.5,      // < $0.50/day = green
    medium: 2,     // < $2/day = yellow
    high: 5,       // >= $5/day = red
  },
  monthly: {
    low: 10,       // < $10/month = green
    medium: 50,    // < $50/month = yellow
    high: 100,     // >= $100/month = red
  },
};

// Get cost color class
export function getCostColor(amount: number, period: 'daily' | 'monthly'): string {
  const thresholds = COST_THRESHOLDS[period];
  if (amount < thresholds.low) return 'text-green-400';
  if (amount < thresholds.medium) return 'text-yellow-400';
  if (amount < thresholds.high) return 'text-orange-400';
  return 'text-red-400';
}

// Card styles
export const CARD_STYLES = {
  default: "rounded-lg border bg-card text-card-foreground shadow-sm",
  warning: "rounded-lg border border-yellow-500/30 bg-yellow-950/30",
  error: "rounded-lg border border-red-500/30 bg-red-950/30",
  success: "rounded-lg border border-green-500/30 bg-green-950/30",
  info: "rounded-lg border border-blue-500/30 bg-blue-950/30",
} as const;

// Button variants
export const BUTTON_STYLES = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-slate-600 hover:bg-slate-700 text-white",
  success: "bg-green-600 hover:bg-green-700 text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  ghost: "hover:bg-slate-100 dark:hover:bg-slate-800",
} as const;

// Spacing scale
export const SPACING = {
  xs: "0.25rem",   // 4px
  sm: "0.5rem",    // 8px
  md: "1rem",      // 16px
  lg: "1.5rem",    // 24px
  xl: "2rem",      // 32px
  "2xl": "3rem",   // 48px
} as const;

// Typography
export const TEXT_STYLES = {
  h1: "text-4xl font-bold tracking-tight",
  h2: "text-3xl font-bold tracking-tight",
  h3: "text-2xl font-semibold",
  h4: "text-xl font-semibold",
  body: "text-base",
  small: "text-sm text-muted-foreground",
  tiny: "text-xs text-muted-foreground",
  code: "font-mono text-sm",
} as const;

// Agent/Icon mapping
export const AGENT_ICONS = {
  researcher: Bot,
  builder: Hammer,
  marketer: Rocket,
  operator: CheckCircle,
  default: Bot,
} as const;

// Export type helpers
export type StatusKey = keyof typeof STATUS_STYLES;
export type CardStyle = keyof typeof CARD_STYLES;
export type ButtonStyle = keyof typeof BUTTON_STYLES;
