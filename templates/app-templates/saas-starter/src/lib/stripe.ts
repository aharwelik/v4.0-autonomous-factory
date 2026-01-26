import Stripe from 'stripe';

/**
 * Stripe client singleton
 *
 * Initialized with the secret key from environment variables
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

/**
 * Get or create a Stripe customer for a user
 *
 * @param email - User's email address
 * @param name - User's name
 * @param metadata - Additional metadata to attach
 * @returns Stripe customer object
 */
export async function getOrCreateCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  // Check if customer already exists
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  return stripe.customers.create({
    email,
    name: name || undefined,
    metadata,
  });
}

/**
 * Create a Stripe checkout session
 *
 * @param customerId - Stripe customer ID
 * @param priceId - Stripe price ID for the subscription
 * @param successUrl - URL to redirect on success
 * @param cancelUrl - URL to redirect on cancel
 * @returns Checkout session URL
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string | null> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session.url;
}

/**
 * Create a Stripe billing portal session
 *
 * @param customerId - Stripe customer ID
 * @param returnUrl - URL to redirect after portal session
 * @returns Billing portal URL
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Cancel a subscription at period end
 *
 * @param subscriptionId - Stripe subscription ID
 * @returns Updated subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume a subscription that was set to cancel
 *
 * @param subscriptionId - Stripe subscription ID
 * @returns Updated subscription
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Get subscription details
 *
 * @param subscriptionId - Stripe subscription ID
 * @returns Subscription object
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}
