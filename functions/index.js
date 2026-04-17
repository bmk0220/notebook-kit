const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.adminCreateUser = onRequest({ cors: true }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { email, role } = req.body;

  try {
    // 1. Create the user in Auth with a random placeholder password
    const userRecord = await admin.auth().createUser({
      email,
      password: Math.random().toString(36).slice(-16) + "A1!", 
      emailVerified: true,
    });

    // 2. Generate Password Reset Link
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // 3. Create the profile in Firestore
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      email,
      role: role || "user",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
    });

    res.status(200).json({ uid: userRecord.uid, resetLink });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
