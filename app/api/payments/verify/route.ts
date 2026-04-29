import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import { grantKitAccess } from '@/lib/payments/fulfillment';

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // 1. Check if payment was already fulfilled (webhook path)
    const paymentQuery = await adminDb.collection('payments')
      .where('gatewayTransactionId', '==', sessionId)
      .where('gateway', '==', 'stripe')
      .limit(1)
      .get();

    if (!paymentQuery.empty) {
      const doc = paymentQuery.docs[0];
      return NextResponse.json({
        fulfilled: true,
        fromWebhook: true,
        payment: {
          id: doc.id,
          ...doc.data(),
        },
      });
    }

    // 2. Not fulfilled yet — check Stripe to see if the session actually completed
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        fulfilled: false,
        sessionStatus: session.status,
        paymentStatus: session.payment_status,
      });
    }

    // 3. Session is paid but webhook never arrived — manually fulfill
    const { userId, userEmail, kitId, kitTitle } = session.metadata || {};

    if (!userId || !kitId) {
      return NextResponse.json({
        fulfilled: false,
        error: 'Session is paid but metadata is incomplete',
        sessionId,
      });
    }

    await grantKitAccess({
      userId,
      userEmail: userEmail || '',
      kitId,
      kitTitle: kitTitle || '',
      amount: (session.amount_total || 0) / 100,
      gateway: 'stripe',
      gatewayTransactionId: sessionId,
    });

    return NextResponse.json({
      fulfilled: true,
      fromWebhook: false,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
