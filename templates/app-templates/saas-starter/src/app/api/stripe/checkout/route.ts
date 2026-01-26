import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const user = await currentUser();

    if (!userId || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { priceId } = await req.json();

    if (!priceId) {
      return new NextResponse('Price ID is required', { status: 400 });
    }

    // Get or create user in database
    let dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!dbUser) {
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: userId,
          email: user.emailAddresses[0]?.emailAddress || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        })
        .returning();
      dbUser = newUser;
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = dbUser.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0]?.emailAddress,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        metadata: {
          clerkId: userId,
        },
      });

      await db
        .update(users)
        .set({ stripeCustomerId: customer.id })
        .where(eq(users.id, dbUser.id));

      stripeCustomerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId: dbUser.id,
        clerkId: userId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
