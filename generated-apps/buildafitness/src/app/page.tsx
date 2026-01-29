export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold text-white mb-6">
            Buildafitness
          </h1>
          <p className="text-2xl text-slate-300 mb-8">
            Build a fitness tracker app
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/sign-up" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition">
              Get Started Free
            </a>
            <a href="/pricing" className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition">
              View Pricing
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-3">Core functionality</h3>
            <p className="text-slate-400">
              Powerful core functionality to help small business owners succeed.
            </p>
          </div>
          
        </div>

        {/* Pricing Teaser */}
        <div className="text-center bg-slate-800/30 p-12 rounded-lg border border-slate-700">
          <h2 className="text-3xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-300 text-xl mb-6">
            Starting at just <span className="text-blue-400 font-bold">$19/month</span>
          </p>
          <a href="/pricing" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition">
            See All Plans
          </a>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-700 text-center text-slate-400">
          <p>&copy; 2026 Buildafitness. Built with App Factory.</p>
        </footer>
      </div>
    </main>
  );
}