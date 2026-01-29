import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Stats } from '@/components/dashboard/Stats';

export default async function DashboardPage() {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1">
        <Header userName={user?.firstName || 'User'} />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">
              Welcome back, {user?.firstName || 'there'}! Here is an overview of
              your account.
            </p>
          </div>
          <Stats />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
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
              <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>
              <div className="grid gap-2">
                <button className="w-full rounded-md bg-primary px-4 py-2 text-left text-sm text-primary-foreground hover:bg-primary/90">
                  Upgrade Plan
                </button>
                <button className="w-full rounded-md bg-secondary px-4 py-2 text-left text-sm hover:bg-secondary/80">
                  View Documentation
                </button>
                <button className="w-full rounded-md bg-secondary px-4 py-2 text-left text-sm hover:bg-secondary/80">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
