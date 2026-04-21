const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

exports.kitPublish = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 120,
    memory: "1GiB",
  },
  async (req, res) => {
    const start = Date.now();

    // ---------- Structured logger ----------
    const log = (step, data = {}) => {
      console.log(
        JSON.stringify({
          service: "kitPublish",
          step,
          ...data,
          ts: new Date().toISOString(),
          elapsedMs: Date.now() - start,
        })
      );
    };

    const fail = (step, error, code = 500) => {
      console.error(
        JSON.stringify({
          service: "kitPublish",
          step,
          error: error?.message || String(error),
          stack: error?.stack,
          ts: new Date().toISOString(),
          elapsedMs: Date.now() - start,
        })
      );

      return res.status(code).json({
        ok: false,
        step,
        error: error?.message || String(error),
      });
    };

    try {
      log("START");

      // ---------- STEP 1: AUTH ----------
      const authHeader = req.headers.authorization || "";
      if (!authHeader.startsWith("Bearer ")) {
        return fail("AUTH_MISSING", "Missing Bearer token", 401);
      }

      const idToken = authHeader.split("Bearer ")[1];

      let decoded;
      try {
        decoded = await admin.auth().verifyIdToken(idToken);
      } catch (err) {
        return fail("AUTH_INVALID", err, 401);
      }

      const userId = decoded.uid;
      log("AUTH_OK", { userId });

      // ---------- STEP 2: PARSE INPUT ----------
      let body;
      try {
        body = req.body;
        log("INPUT_RECEIVED", { keys: Object.keys(body || {}) });
      } catch (err) {
        return fail("INPUT_PARSE_ERROR", err, 400);
      }

      const { kitId, metadata, content } = body || {};

      if (!kitId || !metadata || !content) {
        return fail("VALIDATION_ERROR", "Missing required fields", 400);
      }

      // ---------- STEP 3: LOAD HEAVY LIBS ----------
      let JSZip;
      try {
        JSZip = require("jszip");
        log("DEPS_LOADED");
      } catch (err) {
        return fail("DEP_IMPORT_FAILED", err);
      }

      // ---------- STEP 4: BUILD ZIP ----------
      let zipBuffer;
      try {
        const zip = new JSZip();

        const files = [
          { title: "00_Main_Source", content: content.main_source },
          { title: "01_Overview", content: content.overview },
          { title: "02_Key_Concepts", content: content.key_concepts },
          { title: "03_Step_by_Step", content: content.step_by_step },
          { title: "04_Resources", content: content.resources },
          { title: "05_FAQ", content: content.faq },
          { title: "06_Checklists", content: content.checklists },
          { title: "07_Tips", content: content.tips },
          { title: "08_System_Instructions", content: content.system_instructions },
        ];

        files.forEach((file) => {
          const fileName = `${file.title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}.md`;
          zip.file(fileName, file.content || "");
        });

        zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

        log("ZIP_CREATED", { sizeBytes: zipBuffer.length });
      } catch (err) {
        return fail("ZIP_FAILED", err);
      }

      // ---------- STEP 5: STORAGE ----------
      let downloadUrl;

      try {
        const bucket = admin.storage().bucket();
        const storagePath = `kits/${kitId}/${metadata.slug}.zip`;
        const file = bucket.file(storagePath);

        await file.save(zipBuffer, {
          contentType: "application/zip",
        });

        await file.makePublic();

        downloadUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

        log("STORAGE_OK", { storagePath, downloadUrl });
      } catch (err) {
        return fail("STORAGE_FAILED", err);
      }

      // ---------- STEP 6: FIRESTORE ----------
      try {
        const db = admin.firestore();

        await db.collection("kits").doc(kitId).set({
          ...metadata,
          userId,
          status: "published",
          price: metadata.price || 49,
          category: metadata.category || "general",
          fileUrl: downloadUrl,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await db.collection("kits_content").doc(kitId).set({
          ...content,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        log("FIRESTORE_OK");
      } catch (err) {
        return fail("DB_FAILED", err);
      }

      // ---------- SUCCESS ----------
      log("SUCCESS");

      return res.status(200).json({
        ok: true,
        kitId,
        downloadUrl,
        elapsedMs: Date.now() - start,
      });
    } catch (err) {
      return fail("UNHANDLED_ERROR", err);
    }
  }
);
