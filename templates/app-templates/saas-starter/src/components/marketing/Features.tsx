'use client';

import {
  Shield,
  Zap,
  Database,
  CreditCard,
  Users,
  BarChart3,
  Code,
  Palette,
} from 'lucide-react';

const features = [
  {
    name: 'Authentication Ready',
    description:
      'Clerk authentication pre-configured with sign-in, sign-up, and user management.',
    icon: Shield,
  },
  {
    name: 'Stripe Payments',
    description:
      'Accept payments and manage subscriptions with Stripe integration out of the box.',
    icon: CreditCard,
  },
  {
    name: 'PostgreSQL Database',
    description:
      'Production-ready database with Drizzle ORM for type-safe queries.',
    icon: Database,
  },
  {
    name: 'Lightning Fast',
    description:
      'Built on Next.js 14 with App Router for optimal performance and SEO.',
    icon: Zap,
  },
  {
    name: 'Team Management',
    description:
      'Built-in support for teams, roles, and permissions management.',
    icon: Users,
  },
  {
    name: 'Analytics Dashboard',
    description:
      'Beautiful charts and metrics to track your business growth.',
    icon: BarChart3,
  },
  {
    name: 'Developer Experience',
    description:
      'TypeScript, ESLint, and Prettier configured for a great DX.',
    icon: Code,
  },
  {
    name: 'Beautiful UI',
    description:
      'Tailwind CSS and shadcn/ui components for a polished look.',
    icon: Palette,
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">
            Everything you need
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Ship faster with batteries included
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Stop wasting time on boilerplate. Focus on what makes your product
            unique.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-12">
                <dt className="text-base font-semibold leading-7 text-slate-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <feature.icon
                      className="h-5 w-5 text-white"
                      aria-hidden="true"
                    />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-sm leading-7 text-slate-600">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
