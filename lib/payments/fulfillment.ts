import { adminDb, admin } from '../firebase-admin';

export async function grantKitAccess(params: {
  userId: string;
  userEmail: string;
  kitId: string;
  kitTitle: string;
  amount: number;
  gateway: 'stripe' | 'paypal';
  gatewayTransactionId: string;
}) {
  const { userId, userEmail, kitId, kitTitle, amount, gateway, gatewayTransactionId } = params;

  try {
    await adminDb.runTransaction(async (transaction) => {
      // 1. Check for idempotency (has this transaction already been processed?)
      const paymentQuery = adminDb.collection('payments')
        .where('gatewayTransactionId', '==', gatewayTransactionId)
        .where('gateway', '==', gateway)
        .limit(1);
      
      const paymentSnapshot = await transaction.get(paymentQuery);
      
      if (!paymentSnapshot.empty) {
        console.log(`Transaction ${gatewayTransactionId} already processed.`);
        return;
      }

      // 2. Create the payment record
      const paymentRef = adminDb.collection('payments').doc();
      transaction.set(paymentRef, {
        userId,
        userEmail,
        kitId,
        kitTitle,
        amount,
        currency: 'USD',
        gateway,
        gatewayTransactionId,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Grant access in user_kits
      // We check if they already have a record for this kit to update instead of duplicate
      const userKitQuery = adminDb.collection('user_kits')
        .where('userId', '==', userId)
        .where('kitId', '==', kitId)
        .limit(1);
      
      const userKitSnapshot = await transaction.get(userKitQuery);
      
      if (userKitSnapshot.empty) {
        const userKitRef = adminDb.collection('user_kits').doc();
        transaction.set(userKitRef, {
          userId,
          kitId,
          status: 'owned',
          unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentId: paymentRef.id,
        });
      } else {
        const existingDoc = userKitSnapshot.docs[0];
        transaction.update(existingDoc.ref, {
          status: 'owned',
          unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentId: paymentRef.id,
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error in grantKitAccess fulfillment:', error);
    throw error;
  }
}
