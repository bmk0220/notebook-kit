import { NextResponse } from 'next/server';
import { ordersController } from '@/lib/paypal';
import { grantKitAccess } from '@/lib/payments/fulfillment';

export async function POST(req: Request) {
  try {
    const { orderID, userId, userEmail, kitId, kitTitle } = await req.json();

    if (!orderID || !userId || !kitId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const collect = {
      id: orderID,
      prefer: "return=representation",
    };

    const response = await ordersController.ordersCapture(collect);
    
    // The response body is a string that needs to be parsed if it's not already an object
    // Depending on the version of the SDK, it might already be parsed.
    const result = typeof response.result === 'string' ? JSON.parse(response.result) : response.result;

    if (result.status === 'COMPLETED') {
      const capture = result.purchase_units[0].payments.captures[0];
      const amount = parseFloat(capture.amount.value);
      const gatewayTransactionId = capture.id;

      await grantKitAccess({
        userId,
        userEmail,
        kitId,
        kitTitle,
        amount,
        gateway: 'paypal',
        gatewayTransactionId,
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('PayPal Capture Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
