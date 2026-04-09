const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let credential;
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  credential = admin.credential.cert(serviceAccount);
} else {
  // Application Default Credentials — used automatically on Cloud Run / Firebase App Hosting
  credential = admin.credential.applicationDefault();
}

admin.initializeApp({ credential });
const dbId = process.env.FIRESTORE_DB_ID || 'production';
const db = getFirestore(admin.app(), dbId);
console.log(`Firebase Connected → Firestore DB: ${dbId}`);
const auth = admin.auth();
module.exports = { admin, db, auth };