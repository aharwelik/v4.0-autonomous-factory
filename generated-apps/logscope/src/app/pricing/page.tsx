'use client';

import { PricingWithStripe } from '@/components/PricingWithStripe';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-slate-900">
            LogScope
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Choose the plan that best fits your needs. All plans include a 14-day
            free trial.
          </p>
        </div>
      </div>

      <PricingWithStripe />

      <footer className="mt-20 border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-600">
          <p>&copy; 2026 LogScope. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}