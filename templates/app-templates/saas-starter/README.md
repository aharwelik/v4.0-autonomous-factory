# SaaS Starter Template

A production-ready SaaS starter template built with Next.js 14, featuring authentication, payments, and database integration out of the box.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Authentication:** Clerk
- **Payments:** Stripe
- **Database:** PostgreSQL with Drizzle ORM
- **Styling:** Tailwind CSS + shadcn/ui
- **Language:** TypeScript

## Features

- User authentication (sign up, sign in, sign out)
- Subscription management with Stripe
- Dashboard with analytics
- Marketing pages (landing, pricing)
- Responsive design
- Type-safe database queries
- API routes for user and payment management

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Clerk account
- Stripe account

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

### 3. Database Setup

Generate and apply database migrations:

```bash
npm run db:generate
npm run db:push
```

Or use Drizzle Studio to view your database:

```bash
npm run db:studio
```

### 4. Stripe Configuration

1. Create products and prices in Stripe Dashboard
2. Copy the price IDs to your `.env.local`:
   - `STRIPE_PRICE_ID_BASIC`
   - `STRIPE_PRICE_ID_PRO`
   - `STRIPE_PRICE_ID_ENTERPRISE`

3. Set up Stripe webhooks:
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select events:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

For local development, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 5. Clerk Configuration

1. Create a Clerk application at clerk.com
2. Copy keys to your `.env.local`
3. Configure sign-in/sign-up URLs in Clerk Dashboard:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── (dashboard)/      # Dashboard pages
│   ├── (marketing)/      # Marketing pages
│   └── api/              # API routes
├── components/
│   ├── ui/               # Base UI components
│   ├── dashboard/        # Dashboard components
│   └── marketing/        # Marketing components
├── db/
│   ├── schema.ts         # Database schema
│   └── index.ts          # Database connection
└── lib/
    ├── stripe.ts         # Stripe utilities
    └── utils.ts          # General utilities
```

## Database Schema

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| clerk_id | VARCHAR | Clerk user ID |
| email | VARCHAR | User email |
| name | VARCHAR | User name |
| stripe_customer_id | VARCHAR | Stripe customer ID |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

### Subscriptions Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| stripe_subscription_id | VARCHAR | Stripe subscription ID |
| stripe_price_id | VARCHAR | Stripe price ID |
| stripe_current_period_end | TIMESTAMP | Subscription end date |
| status | VARCHAR | Subscription status |
| cancel_at_period_end | BOOLEAN | Cancellation flag |

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Works with any platform supporting Next.js:
- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify

## Customization

### Adding New Pages

1. Create page in `src/app/`
2. Add route to middleware if protected
3. Update navigation components

### Adding New Components

1. Create component in appropriate folder
2. Follow existing patterns for styling
3. Export from index if needed

### Modifying Database Schema

1. Update `src/db/schema.ts`
2. Run `npm run db:generate`
3. Run `npm run db:push`

## License

MIT License - feel free to use for personal or commercial projects.
