'use client';

import React from 'react';

/**
 * Feature Grid Landing Page Template
 *
 * A comprehensive features section with multiple layout options
 * for showcasing product capabilities.
 *
 * Features:
 * - Multiple layout variants (grid, alternating, centered)
 * - Icon support
 * - Responsive design
 * - Animation-ready
 *
 * @example
 * ```tsx
 * <FeatureGrid
 *   title="Everything you need"
 *   subtitle="Powerful features to help you succeed"
 *   features={[
 *     { icon: "zap", title: "Fast", description: "Lightning fast performance" },
 *     { icon: "shield", title: "Secure", description: "Enterprise-grade security" },
 *   ]}
 * />
 * ```
 */

interface Feature {
  /** Icon name (lucide-react style) or custom icon element */
  icon?: string | React.ReactNode;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Optional link */
  link?: {
    text: string;
    href: string;
  };
  /** Optional badge text */
  badge?: string;
}

interface FeatureGridProps {
  /** Section title */
  title: string;
  /** Section subtitle */
  subtitle?: string;
  /** Eyebrow text above title */
  eyebrow?: string;
  /** Array of features to display */
  features: Feature[];
  /** Layout variant */
  layout?: 'grid' | 'alternating' | 'centered' | 'cards';
  /** Number of columns (for grid layout) */
  columns?: 2 | 3 | 4;
  /** Background color */
  background?: 'white' | 'gray' | 'dark';
  /** Show decorative elements */
  showDecorations?: boolean;
}

// Simple icon components for demo purposes
const icons: Record<string, React.FC<{ className?: string }>> = {
  zap: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  shield: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  chart: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  users: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  code: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  globe: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function FeatureGrid({
  title,
  subtitle,
  eyebrow,
  features,
  layout = 'grid',
  columns = 3,
  background = 'white',
  showDecorations = true,
}: FeatureGridProps) {
  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-slate-50',
    dark: 'bg-slate-900',
  };

  const textColors = {
    white: { title: 'text-slate-900', subtitle: 'text-slate-600', eyebrow: 'text-blue-600' },
    gray: { title: 'text-slate-900', subtitle: 'text-slate-600', eyebrow: 'text-blue-600' },
    dark: { title: 'text-white', subtitle: 'text-slate-300', eyebrow: 'text-blue-400' },
  };

  const columnClasses = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  };

  const renderIcon = (icon: string | React.ReactNode | undefined) => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      const IconComponent = icons[icon];
      return IconComponent ? (
        <IconComponent className="h-6 w-6" />
      ) : (
        <div className="h-6 w-6 rounded bg-blue-100" />
      );
    }
    return icon;
  };

  const renderGridLayout = () => (
    <div
      className={`grid gap-8 md:grid-cols-2 ${columnClasses[columns]}`}
    >
      {features.map((feature, index) => (
        <div key={index} className="relative">
          {feature.badge && (
            <span className="absolute -top-2 right-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {feature.badge}
            </span>
          )}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${
              background === 'dark' ? 'bg-blue-600' : 'bg-blue-100 text-blue-600'
            }`}
          >
            {renderIcon(feature.icon)}
          </div>
          <h3
            className={`mt-4 text-lg font-semibold ${textColors[background].title}`}
          >
            {feature.title}
          </h3>
          <p className={`mt-2 text-sm leading-6 ${textColors[background].subtitle}`}>
            {feature.description}
          </p>
          {feature.link && (
            <a
              href={feature.link.href}
              className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {feature.link.text}
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}
        </div>
      ))}
    </div>
  );

  const renderCardsLayout = () => (
    <div className={`grid gap-6 md:grid-cols-2 ${columnClasses[columns]}`}>
      {features.map((feature, index) => (
        <div
          key={index}
          className={`group relative rounded-2xl border p-6 transition-all hover:shadow-lg ${
            background === 'dark'
              ? 'border-slate-700 bg-slate-800 hover:border-slate-600'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          {feature.badge && (
            <span className="absolute right-4 top-4 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {feature.badge}
            </span>
          )}
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110 ${
              background === 'dark' ? 'bg-blue-600' : 'bg-blue-100 text-blue-600'
            }`}
          >
            {renderIcon(feature.icon)}
          </div>
          <h3
            className={`mt-4 text-lg font-semibold ${textColors[background].title}`}
          >
            {feature.title}
          </h3>
          <p className={`mt-2 text-sm leading-6 ${textColors[background].subtitle}`}>
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );

  const renderAlternatingLayout = () => (
    <div className="space-y-24">
      {features.map((feature, index) => (
        <div
          key={index}
          className={`flex flex-col items-center gap-12 lg:flex-row ${
            index % 2 === 1 ? 'lg:flex-row-reverse' : ''
          }`}
        >
          <div className="flex-1">
            {feature.badge && (
              <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                {feature.badge}
              </span>
            )}
            <h3
              className={`text-2xl font-bold ${textColors[background].title}`}
            >
              {feature.title}
            </h3>
            <p
              className={`mt-4 text-lg leading-7 ${textColors[background].subtitle}`}
            >
              {feature.description}
            </p>
            {feature.link && (
              <a
                href={feature.link.href}
                className="mt-6 inline-flex items-center text-base font-medium text-blue-600 hover:text-blue-500"
              >
                {feature.link.text}
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            )}
          </div>
          <div className="flex-1">
            <div
              className={`aspect-video rounded-2xl ${
                background === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
              }`}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderCenteredLayout = () => (
    <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <div key={index} className="text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
              background === 'dark' ? 'bg-blue-600' : 'bg-blue-100 text-blue-600'
            }`}
          >
            {renderIcon(feature.icon)}
          </div>
          <h3
            className={`mt-6 text-lg font-semibold ${textColors[background].title}`}
          >
            {feature.title}
          </h3>
          <p
            className={`mt-2 text-sm leading-6 ${textColors[background].subtitle}`}
          >
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );

  const layouts = {
    grid: renderGridLayout,
    cards: renderCardsLayout,
    alternating: renderAlternatingLayout,
    centered: renderCenteredLayout,
  };

  return (
    <section className={`relative py-24 sm:py-32 ${backgrounds[background]}`}>
      {/* Decorations */}
      {showDecorations && (
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`absolute -right-40 -top-40 h-80 w-80 rounded-full opacity-10 blur-3xl ${
              background === 'dark' ? 'bg-blue-500' : 'bg-blue-400'
            }`}
          />
          <div
            className={`absolute -bottom-40 -left-40 h-80 w-80 rounded-full opacity-10 blur-3xl ${
              background === 'dark' ? 'bg-purple-500' : 'bg-purple-400'
            }`}
          />
        </div>
      )}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`mx-auto max-w-2xl ${
            layout === 'alternating' ? 'text-left' : 'text-center'
          }`}
        >
          {eyebrow && (
            <p
              className={`text-sm font-semibold uppercase tracking-wide ${textColors[background].eyebrow}`}
            >
              {eyebrow}
            </p>
          )}
          <h2
            className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${textColors[background].title}`}
          >
            {title}
          </h2>
          {subtitle && (
            <p className={`mt-4 text-lg ${textColors[background].subtitle}`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Features */}
        <div className="mt-16 sm:mt-20">{layouts[layout]()}</div>
      </div>
    </section>
  );
}

export default FeatureGrid;
