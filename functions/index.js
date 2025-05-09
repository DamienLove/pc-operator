// pc-operator/functions/index.js

require('dotenv').config();
const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const cors      = require('cors')({ origin: true });

// **Only** specify projectId for Firestore
admin.initializeApp({ projectId: 'pc-operator-d54c0' });
const db = admin.firestore();

// ... rest of your handler unchanged


exports.enqueueCommand = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      console.log('Headers:', req.headers);
      console.log('Body   :', req.body);

      if (req.method !== 'POST') {
        console.error('Wrong method:', req.method);
        return res.status(405).send('Use POST');
      }

      const apiKey = req.get('x-api-key');
      if (!apiKey || apiKey !== process.env.API_SECRET) {
        console.error('Bad API key:', apiKey);
        return res.status(401).send('Bad key');
      }

      const { action, payload } = req.body;
      if (!action || !payload) {
        console.error('Missing action or payload:', req.body);
        return res.status(400).send('Missing action/payload');
      }

      console.log('About to add to Firestore…');
      const docRef = await db.collection('commands').add({
        action,
        payload,
        status: 'new',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Enqueued job ID:', docRef.id);

      return res.json({ id: docRef.id });
    } catch (err) {
      console.error('ERROR STACK:', err.stack || err);
      return res.status(500).send('Internal Server Error');
    }
  });
});
