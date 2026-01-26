'use client';

import React from 'react';

/**
 * Pricing Section Landing Page Template
 *
 * A flexible pricing table component with multiple layout options
 * and billing period toggle.
 *
 * Features:
 * - Monthly/yearly toggle with savings indicator
 * - Multiple plan cards
 * - Feature comparison
 * - Popular plan highlighting
 * - Custom CTA per plan
 *
 * @example
 * ```tsx
 * <PricingSection
 *   title="Simple Pricing"
 *   plans={[
 *     { name: "Basic", price: { monthly: 9, yearly: 90 }, features: [...] },
 *     { name: "Pro", price: { monthly: 29, yearly: 290 }, popular: true, features: [...] },
 *   ]}
 * />
 * ```
 */

interface PricingPlan {
  /** Plan name */
  name: string;
  /** Plan description */
  description?: string;
  /** Pricing (monthly and yearly) */
  price: {
    monthly: number | 'custom';
    yearly: number | 'custom';
  };
  /** Currency symbol */
  currency?: string;
  /** List of features included */
  features: {
    text: string;
    included: boolean;
  }[];
  /** CTA button text */
  ctaText?: string;
  /** CTA callback */
  onCtaClick?: () => void;
  /** Mark as popular/recommended */
  popular?: boolean;
  /** Badge text (e.g., "Best Value") */
  badge?: string;
}

interface PricingSectionProps {
  /** Section title */
  title: string;
  /** Section subtitle */
  subtitle?: string;
  /** Array of pricing plans */
  plans: PricingPlan[];
  /** Background color */
  background?: 'white' | 'gray' | 'dark';
  /** Show billing toggle */
  showToggle?: boolean;
  /** Default billing period */
  defaultPeriod?: 'monthly' | 'yearly';
  /** Yearly savings percentage to display */
  yearlySavings?: number;
  /** FAQ section */
  faq?: {
    question: string;
    answer: string;
  }[];
  /** Enterprise CTA section */
  showEnterpriseCta?: boolean;
  /** Enterprise CTA callback */
  onEnterpriseCta?: () => void;
}

export function PricingSection({
  title,
  subtitle,
  plans,
  background = 'gray',
  showToggle = true,
  defaultPeriod = 'monthly',
  yearlySavings = 20,
  faq,
  showEnterpriseCta = false,
  onEnterpriseCta,
}: PricingSectionProps) {
  const [billingPeriod, setBillingPeriod] = React.useState<'monthly' | 'yearly'>(
    defaultPeriod
  );
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-slate-50',
    dark: 'bg-slate-900',
  };

  const textColors = {
    white: {
      title: 'text-slate-900',
      subtitle: 'text-slate-600',
      card: 'bg-white border-slate-200',
      cardPopular: 'bg-white border-blue-600 ring-2 ring-blue-600',
      feature: 'text-slate-600',
      price: 'text-slate-900',
    },
    gray: {
      title: 'text-slate-900',
      subtitle: 'text-slate-600',
      card: 'bg-white border-slate-200',
      cardPopular: 'bg-white border-blue-600 ring-2 ring-blue-600',
      feature: 'text-slate-600',
      price: 'text-slate-900',
    },
    dark: {
      title: 'text-white',
      subtitle: 'text-slate-300',
      card: 'bg-slate-800 border-slate-700',
      cardPopular: 'bg-slate-800 border-blue-500 ring-2 ring-blue-500',
      feature: 'text-slate-300',
      price: 'text-white',
    },
  };

  const formatPrice = (price: number | 'custom', currency = '$') => {
    if (price === 'custom') return 'Custom';
    return `${currency}${price}`;
  };

  return (
    <section className={`py-24 sm:py-32 ${backgrounds[background]}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className={`text-3xl font-bold tracking-tight sm:text-4xl ${textColors[background].title}`}
          >
            {title}
          </h2>
          {subtitle && (
            <p className={`mt-4 text-lg ${textColors[background].subtitle}`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Billing Toggle */}
        {showToggle && (
          <div className="mt-10 flex justify-center">
            <div
              className={`relative flex rounded-full p-1 ${
                background === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
              }`}
            >
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? `bg-white text-slate-900 shadow`
                    : background === 'dark'
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  billingPeriod === 'yearly'
                    ? `bg-white text-slate-900 shadow`
                    : background === 'dark'
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yearly
                {yearlySavings > 0 && (
                  <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Save {yearlySavings}%
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="mx-auto mt-12 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                plan.popular
                  ? textColors[background].cardPopular
                  : textColors[background].card
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
                    {plan.badge || 'Most Popular'}
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div>
                <h3
                  className={`text-lg font-semibold ${textColors[background].title}`}
                >
                  {plan.name}
                </h3>
                {plan.description && (
                  <p
                    className={`mt-1 text-sm ${textColors[background].subtitle}`}
                  >
                    {plan.description}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="mt-6">
                <span
                  className={`text-4xl font-bold ${textColors[background].price}`}
                >
                  {formatPrice(plan.price[billingPeriod], plan.currency)}
                </span>
                {plan.price[billingPeriod] !== 'custom' && (
                  <span className={`${textColors[background].subtitle}`}>
                    /{billingPeriod === 'monthly' ? 'month' : 'year'}
                  </span>
                )}
              </div>

              {/* Features */}
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    {feature.included ? (
                      <svg
                        className="h-5 w-5 shrink-0 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 shrink-0 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    <span
                      className={`text-sm ${
                        feature.included
                          ? textColors[background].feature
                          : 'text-slate-400 line-through'
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={plan.onCtaClick}
                className={`mt-8 w-full rounded-lg py-3 text-sm font-semibold transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : background === 'dark'
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {plan.ctaText || 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        {/* Enterprise CTA */}
        {showEnterpriseCta && (
          <div
            className={`mx-auto mt-12 max-w-2xl rounded-2xl border p-8 text-center ${textColors[background].card}`}
          >
            <h3
              className={`text-lg font-semibold ${textColors[background].title}`}
            >
              Need a custom solution?
            </h3>
            <p className={`mt-2 ${textColors[background].subtitle}`}>
              Contact our sales team for enterprise pricing and custom features.
            </p>
            <button
              onClick={onEnterpriseCta}
              className="mt-6 rounded-lg border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
            >
              Contact Sales
            </button>
          </div>
        )}

        {/* FAQ Section */}
        {faq && faq.length > 0 && (
          <div className="mx-auto mt-24 max-w-3xl">
            <h3
              className={`text-center text-2xl font-bold ${textColors[background].title}`}
            >
              Frequently Asked Questions
            </h3>
            <div className="mt-8 space-y-4">
              {faq.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-lg border ${textColors[background].card}`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between p-4 text-left"
                  >
                    <span
                      className={`font-medium ${textColors[background].title}`}
                    >
                      {item.question}
                    </span>
                    <svg
                      className={`h-5 w-5 transition-transform ${
                        openFaq === index ? 'rotate-180' : ''
                      } ${textColors[background].subtitle}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openFaq === index && (
                    <div
                      className={`border-t px-4 py-3 ${textColors[background].subtitle}`}
                    >
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PricingSection;
