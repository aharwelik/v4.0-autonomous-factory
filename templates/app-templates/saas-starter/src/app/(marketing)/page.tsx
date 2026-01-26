import { Hero } from '@/components/marketing/Hero';
import { Features } from '@/components/marketing/Features';
import { Pricing } from '@/components/marketing/Pricing';
import { Footer } from '@/components/marketing/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </main>
  );
}
