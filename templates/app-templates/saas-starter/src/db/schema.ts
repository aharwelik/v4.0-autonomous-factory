import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Users table - stores user information synced from Clerk
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  imageUrl: text('image_url'),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Subscriptions table - stores Stripe subscription data
 */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 })
    .notNull()
    .unique(),
  stripePriceId: varchar('stripe_price_id', { length: 255 }).notNull(),
  stripeCurrentPeriodEnd: timestamp('stripe_current_period_end').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Define relations between tables
 */
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

/**
 * Type exports for use throughout the application
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
