import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { grantKitAccess } from '@/lib/payments/fulfillment';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;

    const { userId, userEmail, kitId, kitTitle } = session.metadata;
    const amount = session.amount_total / 100; // Cents to Dollars
    const gatewayTransactionId = session.id;

    try {
      await grantKitAccess({
        userId,
        userEmail,
        kitId,
        kitTitle,
        amount,
        gateway: 'stripe',
        gatewayTransactionId,
      });
    } catch (error) {
      console.error('Fulfillment error in Stripe Webhook:', error);
      return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
