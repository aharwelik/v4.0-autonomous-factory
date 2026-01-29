import Stripe from "stripe";

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
}