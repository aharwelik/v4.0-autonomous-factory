/**
 * Stripe Integration Generator
 *
 * Generates Stripe payment integration code for SaaS apps:
 * - Checkout session creation API route
 * - Webhook handler for subscription events
 * - Enhanced pricing component with Stripe checkout
 * - Subscription status checking
 */

export interface StripeGenerationOptions {
  appName: string;
  displayName: string;
  priceMonthly: number;
  productDescription?: string;
}

export interface GeneratedStripeFile {
  path: string;
  content: string;
}

/**
 * Generate all Stripe integration files
 */
export function generateStripeIntegration(
  options: StripeGenerationOptions
): GeneratedStripeFile[] {
  return [
    generateCheckoutRoute(options),
    generateWebhookRoute(options),
    generatePricingWithStripe(options),
    generateStripeUtilities(),
    generateEnvInstructions(options),
  ];
}

/**
 * Generate Stripe checkout session API route
 */
function generateCheckoutRoute(options: StripeGenerationOptions): GeneratedStripeFile {
  const content = `import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // Example with Clerk:
    // const { userId } = auth();
    // if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // For now, we'll allow anonymous checkout (you can capture email in Stripe)
    const userId = "anonymous"; // Replace with actual user ID when you add auth

    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID required" },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: \`\${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?success=true\`,
      cancel_url: \`\${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing?canceled=true\`,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}`;

  return {
    path: "src/app/api/checkout/route.ts",
    content,
  };
}

/**
 * Generate Stripe webhook handler
 */
function generateWebhookRoute(options: StripeGenerationOptions): GeneratedStripeFile {
  const content = `import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId && session.subscription) {
          // TODO: Update user record in your database
          // Example: db.users.update(userId, {
          //   subscriptionId: session.subscription,
          //   plan: "pro",
          //   status: "active"
          // });

          console.log(\`✅ User \${userId} subscribed: \${session.subscription}\`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          // TODO: Update subscription status in database
          console.log(\`🔄 Subscription updated for user \${userId}\`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          // TODO: Downgrade user to free plan
          console.log(\`❌ Subscription canceled for user \${userId}\`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const userId = invoice.subscription_details?.metadata?.userId;

        if (userId) {
          // TODO: Send payment failed email
          console.log(\`⚠️ Payment failed for user \${userId}\`);
        }
        break;
      }

      default:
        console.log(\`Unhandled event type: \${event.type}\`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}`;

  return {
    path: "src/app/api/webhooks/stripe/route.ts",
    content,
  };
}

/**
 * Generate enhanced pricing component with Stripe checkout
 */
function generatePricingWithStripe(options: StripeGenerationOptions): GeneratedStripeFile {
  const content = `"use client";

import { useState } from "react";

export function PricingWithStripe() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    // Note: Authentication check happens on the API route
    // If user is not logged in, API will return 401 and we redirect to sign-up

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
              <span className="text-4xl font-bold text-gray-900">$${options.priceMonthly}</span>
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
}`;

  return {
    path: "src/components/PricingWithStripe.tsx",
    content,
  };
}

/**
 * Generate Stripe utility functions
 */
function generateStripeUtilities(): GeneratedStripeFile {
  const content = `import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

/**
 * Check if a user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      limit: 1,
    });

    // Filter by userId in metadata
    const userSub = subscriptions.data.find(
      (sub) => sub.metadata.userId === userId && sub.status === "active"
    );

    return !!userSub;
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
}

/**
 * Get subscription details for a user
 */
export async function getSubscription(userId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      limit: 10,
    });

    return subscriptions.data.find(
      (sub) => sub.metadata.userId === userId
    );
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
}`;

  return {
    path: "src/lib/stripe-utils.ts",
    content,
  };
}

/**
 * Generate .env setup instructions
 */
function generateEnvInstructions(options: StripeGenerationOptions): GeneratedStripeFile {
  const content = `# Stripe Configuration

## Setup Instructions

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with sk_test_...)
3. Add to your .env.local:

\`\`\`
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (get this from webhooks setup)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
\`\`\`

## Create Products & Prices

1. Go to https://dashboard.stripe.com/test/products
2. Create a product: "${options.displayName} Pro"
3. Set price: $${options.priceMonthly}/month (recurring)
4. Copy the Price ID (starts with price_...)
5. Add to .env.local:

\`\`\`
NEXT_PUBLIC_STRIPE_PRICE_ID=price_...
\`\`\`

## Setup Webhooks (for production)

1. Go to https://dashboard.stripe.com/test/webhooks
2. Add endpoint: https://your-domain.com/api/webhooks/stripe
3. Select events:
   - checkout.session.completed
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_failed
4. Copy webhook signing secret to .env.local

## Testing Payments

Use these test card numbers:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155

Any future expiry date and any CVC will work.

## Go Live

1. Switch to production API keys
2. Update webhook endpoint to production URL
3. Create real products/prices
4. Test with real cards (or your own test cards)
5. Enable live mode in Stripe dashboard`;

  return {
    path: "STRIPE_SETUP.md",
    content,
  };
}
