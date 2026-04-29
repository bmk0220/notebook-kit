import { NextResponse } from 'next/server';
import { ordersController } from '@/lib/paypal';
import { grantKitAccess } from '@/lib/payments/fulfillment';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  console.log('[PayPal Capture] Starting capture process...');
  console.log('[PayPal Capture] Config Check:', {
    hasClientId: !!process.env.PAYPAL_CLIENT_ID,
    hasSecret: !!process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE,
    nodeEnv: process.env.NODE_ENV,
    clientIdStart: process.env.PAYPAL_CLIENT_ID?.substring(0, 5) + '...'
  });
  try {
    const body = await req.json();
    const { orderID, userId, userEmail, kitId, kitTitle } = body;
    console.log('[PayPal Capture] Request body:', { orderID, userId, kitId });

    if (!orderID || !userId || !kitId) {
      console.error('[PayPal Capture] Missing parameters:', { orderID, userId, kitId });
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Fetch the kit from Firestore to verify the actual price
    console.log('[PayPal Capture] Fetching kit from Firestore:', kitId);
    let kitData;
    try {
      const kitDoc = await adminDb.collection('kits').doc(kitId).get();
      if (!kitDoc.exists) {
        console.error('[PayPal Capture] Kit not found in Firestore:', kitId);
        return NextResponse.json({ error: 'Kit not found' }, { status: 404 });
      }
      kitData = kitDoc.data()!;
    } catch (dbError: any) {
      console.error('[PayPal Capture] Firestore Error:', dbError);
      return NextResponse.json({ error: 'Database error while verifying kit' }, { status: 500 });
    }
    
    const expectedPrice = Number(kitData.price);
    console.log('[PayPal Capture] Expected price:', expectedPrice);

    // 2. Capture the order
    console.log('[PayPal Capture] Calling PayPal ordersController.captureOrder for ID:', orderID);
    let response;
    try {
      response = await ordersController.captureOrder({
        id: orderID,
        prefer: "return=representation",
      });
      console.log('[PayPal Capture] PayPal response status:', response.statusCode);
    } catch (paypalError: any) {
      console.error('[PayPal Capture] PayPal SDK Error:', paypalError);
      // Often the SDK wraps the actual error in response.body or similar
      if (paypalError.response) {
        console.error('[PayPal Capture] PayPal Error Body:', paypalError.response.body);
      }
      return NextResponse.json({ error: 'PayPal capture failed', details: paypalError.message }, { status: 500 });
    }
    
    const result: any = response.result;
    console.log('[PayPal Capture] Capture result status:', result.status);

    if (result.status === 'COMPLETED') {
      const purchaseUnit = result.purchaseUnits?.[0] || result.purchase_units?.[0];
      const payments = purchaseUnit?.payments;
      const capture = payments?.captures?.[0];

      if (!capture) {
        console.error('[PayPal Capture] Capture information missing from result:', JSON.stringify(result));
        return NextResponse.json({ error: 'Capture information missing from PayPal response' }, { status: 500 });
      }

      const amountValue = capture.amount?.value;
      const amount = parseFloat(amountValue);
      const gatewayTransactionId = capture.id;
      console.log('[PayPal Capture] Captured amount:', amount, 'Transaction ID:', gatewayTransactionId);

      // 3. Verify the paid amount against the expected price
      if (Math.abs(amount - expectedPrice) > 0.01) {
        console.error(`[PayPal Capture] Price mismatch: Paid ${amount}, Expected ${expectedPrice}`);
        return NextResponse.json({ 
          error: 'Price mismatch. Payment captured but access not automatically granted.',
          paid: amount,
          expected: expectedPrice
        }, { status: 400 });
      }

      // 4. Grant access
      console.log('[PayPal Capture] Granting kit access...');
      try {
        await grantKitAccess({
          userId,
          userEmail: userEmail || '',
          kitId,
          kitTitle: kitTitle || kitData.title || 'Unknown Kit',
          amount,
          gateway: 'paypal',
          gatewayTransactionId,
        });
        console.log('[PayPal Capture] Access granted successfully');
      } catch (grantError: any) {
        console.error('[PayPal Capture] Grant Access Error:', grantError);
        return NextResponse.json({ error: 'Payment successful but access grant failed' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else {
      console.error('[PayPal Capture] Unsuccessful status:', result.status);
      return NextResponse.json({ error: `Payment status: ${result.status}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[PayPal Capture] Unexpected Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
