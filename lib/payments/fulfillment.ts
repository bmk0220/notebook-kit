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
  console.log(`Starting grantKitAccess for ${userId} and kit ${kitId}`);

  try {
    await adminDb.runTransaction(async (transaction) => {
      console.log('Inside transaction...');
      // 1. Prepare read queries
      const paymentQuery = adminDb.collection('payments')
        .where('gatewayTransactionId', '==', gatewayTransactionId)
        .where('gateway', '==', gateway)
        .limit(1);
      
      const userKitQuery = adminDb.collection('user_kits')
        .where('userId', '==', userId)
        .where('kitId', '==', kitId)
        .limit(1);

      // 2. Perform all reads
      const [paymentSnapshot, userKitSnapshot] = await Promise.all([
        transaction.get(paymentQuery),
        transaction.get(userKitQuery)
      ]);
      
      // 3. Check for idempotency
      if (!paymentSnapshot.empty) {
        console.log(`Transaction ${gatewayTransactionId} already processed.`);
        return;
      }

      console.log('Creating payment record...');
      // 4. Perform all writes
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

      console.log('Checking user_kits record...');
      if (userKitSnapshot.empty) {
        console.log('Creating new user_kits record...');
        const userKitRef = adminDb.collection('user_kits').doc();
        transaction.set(userKitRef, {
          userId,
          kitId,
          status: 'owned',
          unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
          grantedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentId: paymentRef.id,
        });
      } else {
        console.log('Updating existing user_kits record...');
        const existingDoc = userKitSnapshot.docs[0];
        transaction.update(existingDoc.ref, {
          status: 'owned',
          unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
          grantedAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentId: paymentRef.id,
        });
      }
    });

    console.log('Transaction committed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in grantKitAccess fulfillment:', error);
    throw error;
  }
}
