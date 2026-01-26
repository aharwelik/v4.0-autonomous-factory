'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Basic',
    description: 'Perfect for side projects and small apps.',
    price: { monthly: 9, yearly: 90 },
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC || '',
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_YEARLY || '',
    },
    features: [
      '1 project',
      '1,000 monthly active users',
      'Basic analytics',
      'Email support',
      'Community access',
    ],
  },
  {
    name: 'Pro',
    description: 'For growing businesses and teams.',
    price: { monthly: 29, yearly: 290 },
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || '',
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY || '',
    },
    popular: true,
    features: [
      '5 projects',
      '10,000 monthly active users',
      'Advanced analytics',
      'Priority email support',
      'Team collaboration',
      'Custom domains',
      'API access',
    ],
  },
  {
    name: 'Enterprise',
    description: 'For large scale applications.',
    price: { monthly: 99, yearly: 990 },
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE || '',
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE_YEARLY || '',
    },
    features: [
      'Unlimited projects',
      'Unlimited users',
      'Custom analytics',
      '24/7 phone support',
      'Advanced security',
      'SLA guarantee',
      'Dedicated account manager',
      'Custom integrations',
    ],
  },
];

export function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    'monthly'
  );

  const handleCheckout = async (priceId: string) => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <section id="pricing" className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Choose the plan that best fits your needs. All plans include a 14-day
            free trial.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-10 flex justify-center">
          <div className="relative flex rounded-full bg-slate-200 p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'relative rounded-full px-4 py-2 text-sm font-medium transition-colors',
                billingPeriod === 'monthly'
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={cn(
                'relative rounded-full px-4 py-2 text-sm font-medium transition-colors',
                billingPeriod === 'yearly'
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Yearly
              <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto mt-12 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'relative flex flex-col',
                plan.popular && 'border-blue-600 shadow-lg'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">
                    ${plan.price[billingPeriod]}
                  </span>
                  <span className="text-slate-600">
                    /{billingPeriod === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-4 w-4 shrink-0 text-green-600" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleCheckout(plan.priceId[billingPeriod])}
                >
                  Get Started
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
