const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const JSZip = require("jszip");

admin.initializeApp();

exports.kitPublish = onRequest({ region: "us-central1" }, async (req, res) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { kitId, metadata, content } = req.body;

    if (!kitId || !metadata || !content) {
      return res.status(400).json({ error: "kitId, metadata, and content are required" });
    }

    console.log("kitPublish: Attempting to publish kit", { userId, kitId });

    // --- Publishing Logic (from lib/forge.ts) ---
    const files = [
      { title: '00_Main_Source', content: content.main_source },
      { title: '01_Overview', content: content.overview },
      { title: '02_Key_Concepts', content: content.key_concepts },
      { title: '03_Step_by_Step', content: content.step_by_step },
      { title: '04_Resources', content: content.resources },
      { title: '05_FAQ', content: content.faq },
      { title: '06_Checklists', content: content.checklists },
      { title: '07_Tips', content: content.tips },
      { title: '08_System_Instructions', content: content.system_instructions },
    ];

    const zip = new JSZip();
    files.forEach((file) => {
      const fileName = `${file.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}.md`;
      zip.file(fileName, file.content);
    });

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    const storagePath = `kits/${kitId}/${metadata.slug}.zip`;
    const bucket = getStorage().bucket();
    const file = bucket.file(storagePath);
    
    await file.save(zipBuffer, { contentType: 'application/zip' });
    await file.makePublic();
    
    const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    await admin.firestore().collection("kits").doc(kitId).set({
      ...metadata,
      price: 49,
      category: "general",
      status: "published",
      fileUrl: downloadUrl,
      userId: userId,
      createdAt: FieldValue.serverTimestamp(),
    });

    await admin.firestore().collection("kits_content").doc(kitId).set({
      ...content,
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true, kitId, downloadUrl });
  } catch (error) {
    console.error("kitPublish error:", error);
    res.status(500).json({ error: error.message });
  }
});
