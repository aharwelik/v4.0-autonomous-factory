import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
      with: {
        subscriptions: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST() {
  try {
    const { userId } = auth();
    const clerkUser = await currentUser();

    if (!userId || !clerkUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      })
      .returning();

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    const [updatedUser] = await db
      .update(users)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, userId))
      .returning();

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
