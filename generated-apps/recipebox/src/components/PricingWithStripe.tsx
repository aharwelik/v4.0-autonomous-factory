"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export function PricingWithStripe() {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      window.location.href = "/sign-up";
      return;
    }

    setLoading(priceId);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
      setLoading(null);
    }
  };

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:max-w-4xl lg:mx-auto">
          {/* Free Plan */}
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900">Free</h3>
            <p className="mt-4 text-sm text-gray-600">
              Get started with basic features
            </p>
            <p className="mt-8">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-base font-medium text-gray-500">/month</span>
            </p>
            <ul className="mt-8 space-y-3 text-sm text-gray-600">
              <li className="flex items-center">
                <svg className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Basic features
              </li>
              <li className="flex items-center">
                <svg className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Limited usage
              </li>
              <li className="flex items-center">
                <svg className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Community support
              </li>
            </ul>
            <button
              onClick={() => (window.location.href = "/sign-up")}
              className="mt-8 w-full rounded-md border border-gray-300 bg-white px-6 py-3 text-center text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              Get Started
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-lg border-2 border-blue-500 bg-white p-8 shadow-lg">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-blue-500 px-4 py-1 text-sm font-semibold text-white">
                Most Popular
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Pro</h3>
            <p className="mt-4 text-sm text-gray-600">
              Everything you need to scale
            </p>
            <p className="mt-8">
              <span className="text-4xl font-bold text-gray-900">$12</span>
              <span className="text-base font-medium text-gray-500">/month</span>
            </p>
            <ul className="mt-8 space-y-3 text-sm text-gray-600">
              <li className="flex items-center">
                <svg className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                All Free features
              </li>
              <li className="flex items-center">
                <svg className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Unlimited usage
              </li>
              <li className="flex items-center">
                <svg className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Priority support
              </li>
              <li className="flex items-center">
                <svg className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Advanced analytics
              </li>
            </ul>
            <button
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || "price_...")}
              disabled={loading !== null}
              className="mt-8 w-full rounded-md bg-blue-600 px-6 py-3 text-center text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Upgrade to Pro"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}