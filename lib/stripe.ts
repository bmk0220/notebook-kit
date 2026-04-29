import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build';

export const stripe = new Stripe(stripeSecretKey, {
  // @ts-expect-error - Stripe versioning
  apiVersion: '2025-01-27.acacia', // Using a recent stable version
  typescript: true,
});
