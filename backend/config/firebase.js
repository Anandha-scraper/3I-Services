const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
// Initialize Firebase Admin - Local Development
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('add serviceAccountKey.json to backend/config/');
  process.exit(1);
}
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
console.log("Firebase Connected");
const db = admin.firestore();
const auth = admin.auth();
module.exports = { admin, db, auth };