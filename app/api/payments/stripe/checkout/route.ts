import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { kitId, kitTitle, userId, userEmail, slug, partnerCode } = await req.json();

    if (!userId || !kitId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Fetch the kit from Firestore to verify the actual price
    const kitDoc = await adminDb.collection('kits').doc(kitId).get();
    if (!kitDoc.exists) {
      return NextResponse.json({ error: 'Kit not found' }, { status: 404 });
    }
    const kitData = kitDoc.data()!;
    const price = Number(kitData.price);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://notebook-kit.web.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: kitData.title || kitTitle,
              description: `Notebook Kit: ${kitData.title || kitTitle}`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/marketplace/${slug}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/marketplace/${slug}?canceled=true`,
      metadata: {
        userId,
        userEmail: userEmail || '',
        kitId,
        kitTitle: kitData.title || kitTitle,
        partnerId: partnerCode,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
