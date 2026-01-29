import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Buildareading
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {user?.firstName || 'User'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Welcome back, {user?.firstName || 'there'}! Here is an overview of your account.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-600">Active Projects</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">0</div>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-600">This Month</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">0</div>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-slate-600">Total Usage</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">0</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Core functionality</h3>
            <p className="mt-2 text-sm text-slate-600">Manage your core functionality</p>
            <button className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Get Started
            </button>
          </div>
        </div>

        {/* Activity & Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Account created successfully</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Email verified</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/pricing"
                className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
              >
                Upgrade Plan
              </Link>
              <button className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                View Documentation
              </button>
              <button className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}