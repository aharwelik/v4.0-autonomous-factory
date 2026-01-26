import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { users, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return new NextResponse('Webhook Error', { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  switch (event.type) {
    case 'checkout.session.completed': {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      if (!session?.metadata?.userId) {
        console.error('No userId in session metadata');
        return new NextResponse('Missing user ID', { status: 400 });
      }

      await db.insert(subscriptions).values({
        userId: session.metadata.userId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
        status: subscription.status,
      });

      break;
    }

    case 'invoice.payment_succeeded': {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      await db
        .update(subscriptions)
        .set({
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
          status: subscription.status,
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;

      await db
        .update(subscriptions)
        .set({
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000
          ),
          status: subscription.status,
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      await db
        .update(subscriptions)
        .set({
          status: 'canceled',
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

      break;
    }
  }

  return new NextResponse(null, { status: 200 });
}
