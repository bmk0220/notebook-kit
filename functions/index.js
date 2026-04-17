const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.adminCreateUser = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { email, password, role } = req.body;

  try {
    // 1. Create the user in Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: true,
    });

    // 2. Create the profile in Firestore
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      email,
      role: role || "user",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
    });

    res.status(200).json({ uid: userRecord.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
