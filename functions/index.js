/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
require('dotenv').config();
const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const cors      = require('cors')({origin: true});

admin.initializeApp();
const db = admin.firestore();

// POST /enqueueCommand  {action:"ahk", payload:{script:"MsgBox Hi!"}}
exports.enqueueCommand = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).send('Use POST');

    if (req.get('x-api-key') !== process.env.API_SECRET)
      return res.status(401).send('Bad key');

    const body = req.body;
    if (!body?.action) return res.status(400).send('Missing action');

    const ref = await db.collection('commands').add({
      ...body,
      status: 'new',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({id: ref.id});
  });
});

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
