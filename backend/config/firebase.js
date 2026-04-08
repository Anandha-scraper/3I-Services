const admin = require('firebase-admin');
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
console.log("Firebase Connected");
const db = admin.firestore();
const auth = admin.auth();
module.exports = { admin, db, auth };