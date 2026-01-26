'use client';

import React from 'react';

/**
 * Hero-Centric Landing Page Template
 *
 * A conversion-focused hero section with gradient background,
 * compelling headline, and clear call-to-action.
 *
 * Features:
 * - Full-viewport hero section
 * - Animated gradient background
 * - Social proof indicators
 * - Email capture form
 * - Responsive design
 *
 * @example
 * ```tsx
 * <HeroCentric
 *   headline="Launch Your Startup in Days, Not Months"
 *   subheadline="Everything you need to go from idea to revenue."
 *   ctaText="Start Free Trial"
 *   onCtaClick={() => console.log('CTA clicked')}
 * />
 * ```
 */

interface HeroCentricProps {
  /** Main headline text */
  headline: string;
  /** Supporting subheadline text */
  subheadline: string;
  /** Primary CTA button text */
  ctaText: string;
  /** Secondary CTA button text */
  secondaryCtaText?: string;
  /** Callback when primary CTA is clicked */
  onCtaClick?: () => void;
  /** Callback when secondary CTA is clicked */
  onSecondaryCtaClick?: () => void;
  /** Company/brand name */
  brandName?: string;
  /** Social proof metrics to display */
  socialProof?: {
    label: string;
    value: string;
  }[];
  /** Show email capture form instead of button */
  showEmailCapture?: boolean;
  /** Placeholder text for email input */
  emailPlaceholder?: string;
  /** Background variant */
  backgroundVariant?: 'gradient' | 'solid' | 'mesh';
}

export function HeroCentric({
  headline,
  subheadline,
  ctaText,
  secondaryCtaText,
  onCtaClick,
  onSecondaryCtaClick,
  brandName = 'YourBrand',
  socialProof,
  showEmailCapture = false,
  emailPlaceholder = 'Enter your email',
  backgroundVariant = 'gradient',
}: HeroCentricProps) {
  const [email, setEmail] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCtaClick?.();
  };

  const backgroundStyles = {
    gradient:
      'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
    solid: 'bg-slate-900',
    mesh: 'bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]',
  };

  return (
    <section
      className={`relative min-h-screen overflow-hidden ${backgroundStyles[backgroundVariant]}`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-4 top-0 h-72 w-72 animate-pulse rounded-full bg-purple-500 opacity-10 blur-3xl" />
        <div className="absolute -right-4 bottom-0 h-72 w-72 animate-pulse rounded-full bg-blue-500 opacity-10 blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="text-xl font-bold text-white">{brandName}</div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
              Features
            </button>
            <button className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
              Pricing
            </button>
            <button className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
        {/* Badge */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            Now in public beta
          </span>
        </div>

        {/* Headline */}
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          {headline}
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
          {subheadline}
        </p>

        {/* CTA Section */}
        <div className="mt-10">
          {showEmailCapture ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={emailPlaceholder}
                required
                className="h-12 min-w-[300px] rounded-lg border border-white/20 bg-white/5 px-4 text-white placeholder:text-slate-400 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              <button
                type="submit"
                className="h-12 rounded-lg bg-white px-8 font-semibold text-slate-900 transition-colors hover:bg-slate-100"
              >
                {ctaText}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <button
                onClick={onCtaClick}
                className="h-12 rounded-lg bg-white px-8 font-semibold text-slate-900 transition-all hover:bg-slate-100 hover:shadow-lg hover:shadow-white/20"
              >
                {ctaText}
              </button>
              {secondaryCtaText && (
                <button
                  onClick={onSecondaryCtaClick}
                  className="h-12 rounded-lg border border-white/20 bg-white/5 px-8 font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  {secondaryCtaText}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Social Proof */}
        {socialProof && socialProof.length > 0 && (
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 border-t border-white/10 pt-8">
            {socialProof.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-white">{item.value}</div>
                <div className="text-sm text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Trusted By */}
        <div className="mt-16">
          <p className="mb-8 text-sm text-slate-400">
            Trusted by innovative teams worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale">
            {['Company A', 'Company B', 'Company C', 'Company D'].map(
              (company) => (
                <div
                  key={company}
                  className="text-lg font-semibold text-white"
                >
                  {company}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/20 p-2">
          <div className="h-2 w-1 animate-bounce rounded-full bg-white/40" />
        </div>
      </div>
    </section>
  );
}

export default HeroCentric;
