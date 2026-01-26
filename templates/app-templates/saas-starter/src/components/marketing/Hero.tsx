'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="relative z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-slate-900">
              SaaS Starter
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="#features"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Pricing
              </Link>
              <Link
                href="#"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Documentation
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Sign In
            </Link>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              Now with AI-powered features
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Build your SaaS product{' '}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              10x faster
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Ship your next SaaS in days, not months. Pre-built authentication,
            payments, database, and beautiful UI components included.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Start Building Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            No credit card required. 14-day free trial.
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 sm:mt-24">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-violet-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-xl border bg-slate-900 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-4 text-sm text-slate-400">
                  dashboard.yourapp.com
                </span>
              </div>
              <div className="p-8">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-slate-800 p-4">
                    <p className="text-sm text-slate-400">Total Users</p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      12,543
                    </p>
                    <p className="mt-1 text-xs text-green-400">+12% this week</p>
                  </div>
                  <div className="rounded-lg bg-slate-800 p-4">
                    <p className="text-sm text-slate-400">Revenue</p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      $45,234
                    </p>
                    <p className="mt-1 text-xs text-green-400">+8% this week</p>
                  </div>
                  <div className="rounded-lg bg-slate-800 p-4">
                    <p className="text-sm text-slate-400">Active Now</p>
                    <p className="mt-1 text-2xl font-semibold text-white">342</p>
                    <p className="mt-1 text-xs text-blue-400">Live</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
