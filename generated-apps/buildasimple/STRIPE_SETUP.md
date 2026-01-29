# Stripe Configuration

## Setup Instructions

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with sk_test_...)
3. Add to your .env.local:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (get this from webhooks setup)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Create Products & Prices

1. Go to https://dashboard.stripe.com/test/products
2. Create a product: "Buildasimple Pro"
3. Set price: $19/month (recurring)
4. Copy the Price ID (starts with price_...)
5. Add to .env.local:

```
NEXT_PUBLIC_STRIPE_PRICE_ID=price_...
```

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
5. Enable live mode in Stripe dashboard