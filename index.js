/**
 * pc-operator/index.js
 * DamienLove – v0.1
 *
 * Listens for Firestore “command” docs,
 * executes them (shell, AutoHotkey, or Power Automate Desktop),
 * and exposes a tiny /hello endpoint for ngrok health-checks.
 */

require('dotenv').config();                // load PORT if you set one
const { execSync, spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const express = require('express');
const admin   = require('firebase-admin');

// ---------- 1. Firebase bootstrap ----------
const serviceAccount = require('./keys/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const COLLECTION = 'commands';             // Firestore collection name
console.log(`[🔥] Watching collection: ${COLLECTION}`);

db.collection(COLLECTION)
  .where('status', '==', 'new')            // only grab fresh jobs
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(async change => {
      if (change.type !== 'added') return;

      const doc = change.doc;
      const { action, payload } = doc.data();

      try {
        console.log(`[⚡] Running ${action}`);
        await execute(action, payload);
        await doc.ref.update({ status: 'done', finishedAt: Date.now() });
      } catch (err) {
        console.error(err);
        await doc.ref.update({
          status: 'error',
          error: err.message,
          finishedAt: Date.now()
        });
      }
    });
  });

// ---------- 2. Action router ----------
async function execute(action, payload) {
  switch (action) {
    case 'shell':   return execSync(payload.cmd, { stdio: 'inherit' });
    case 'ahk':     return runAHK(payload.script);
    case 'pad_flow':return triggerPAD(payload.flowId);
    default: throw new Error(`Unknown action: ${action}`);
  }
}

// ---------- 3. AutoHotkey helper ----------
function runAHK(scriptText) {
  // Write script to temp file
  const scriptPath = path.join(os.tmpdir(), `remote_${Date.now()}.ahk`);
  fs.writeFileSync(scriptPath, scriptText);

  // AutoHotkey.exe must be in PATH; tweak if yours lives elsewhere
  return spawn('AutoHotkey.exe', [scriptPath], { stdio: 'inherit' });
}

// ---------- 4. Power Automate Desktop helper ----------
function triggerPAD(flowId) {
  // Example Power Automate CLI call; adjust path as needed
  return execSync(
    `"${process.env['ProgramFiles']}\\Power Automate Desktop\\PAD.Console.Agent.exe" execute --flow-id ${flowId}`,
    { stdio: 'inherit' }
  );
}

// ---------- 5. Hello-world web service ----------
const app  = express();
const PORT = process.env.PORT || 4040;

app.get('/hello', (_, res) => res.send('🖥️  Operator online!'));
app.listen(PORT, () => console.log(`[🌐] Local API: http://localhost:${PORT}/hello`));
