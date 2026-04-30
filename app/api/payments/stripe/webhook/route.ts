import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { grantKitAccess } from '@/lib/payments/fulfillment';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let rawBody: Buffer;
  try {
    const arrayBuffer = await req.arrayBuffer();
    rawBody = Buffer.from(arrayBuffer);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe Webhook] Error reading request body:', errorMessage);
    return NextResponse.json({ error: 'Error reading body' }, { status: 400 });
  }

  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Stripe Webhook] No stripe-signature header');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    console.log(`[Stripe Webhook] Verified event: ${event.id}, Type: ${event.type}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Stripe Webhook] Signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('[Stripe Webhook] Processing checkout.session.completed:', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      metadata: session.metadata,
    });

    const { userId, userEmail, kitId, kitTitle, partnerId } = (session.metadata || {}) as {
      userId?: string;
      userEmail?: string;
      kitId?: string;
      kitTitle?: string;
      partnerId?: string;
    };

    if (!userId || !kitId) {
      console.error('[Stripe Webhook] Missing metadata in Stripe session:', {
        sessionId: session.id,
        metadata: session.metadata,
      });
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const amount = (session.amount_total || 0) / 100;
    const gatewayTransactionId = session.id;

    try {
      await grantKitAccess({
        userId,
        userEmail: userEmail || '',
        kitId,
        kitTitle: kitTitle || '',
        amount,
        gateway: 'stripe',
        gatewayTransactionId,
        partnerId,
      });
      console.log('[Stripe Webhook] Fulfillment completed for session:', session.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Stripe Webhook] Fulfillment error:', {
        sessionId: session.id,
        error: errorMessage,
      });
      return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 });
    }
  } else {
    console.log('[Stripe Webhook] Unhandled event type:', event.type);
  }

  return NextResponse.json({ received: true });
}
