# Payments Setup Guide

To enable the payment system, you must configure the following environment variables in your `.env.local` file.

## Stripe Configuration
1. **Account:** Create a Stripe account at [stripe.com](https://stripe.com).
2. **API Keys:** Go to Developers > API Keys to get your keys.
3. **Webhook:** Go to Developers > Webhooks.
   - Add an endpoint: `https://your-domain.com/api/payments/stripe/webhook`
   - Select event: `checkout.session.completed`
   - Copy the "Signing Secret".

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## PayPal Configuration
1. **Developer Portal:** Go to [developer.paypal.com](https://developer.paypal.com).
2. **App:** Create a "REST API" App.
3. **Credentials:** Copy the Client ID and Client Secret.

```env
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

## Global App Configuration
Ensure your app URL is defined so gateways can redirect users back correctly.

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Firebase Admin Configuration (Fulfillment)
The backend requires a Service Account to grant kit access and write to the `payments` collection (which is blocked for frontend writes).

1. **Service Account:** In Firebase Console, go to Project Settings > Service Accounts.
2. **Generate Key:** Click "Generate new private key".
3. **Environment Variable:** Minify the JSON and paste it.

```env
FIREBASE_SERVICE_ACCOUNT='{"project_id": "...", "private_key": "...", "client_email": "...", ...}'
```

---
**Note:** For local development of Stripe Webhooks, use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward events:
`stripe listen --forward-to localhost:3000/api/payments/stripe/webhook`
