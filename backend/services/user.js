const { db, auth } = require('../config/firebase');

class UserService {
  constructor() {
    this.collection = db.collection('users');
  }

  async findByUserId(userId) {
    const snapshot = await this.collection.where('userId', '==', userId).limit(1).get();
    if (snapshot.empty) return null;
    let user = null;
    snapshot.forEach(doc => { user = { id: doc.id, ...doc.data() }; });
    return user;
  }

  async findByEmail(email) {
    const snapshot = await this.collection.where('email', '==', email.toLowerCase().trim()).limit(1).get();
    if (snapshot.empty) return null;
    let user = null;
    snapshot.forEach(doc => { user = { id: doc.id, ...doc.data() }; });
    return user;
  }

  async findByPhone(phone) {
    if (!phone) return null;
    const snapshot = await this.collection.where('phone', '==', phone.trim()).limit(1).get();
    if (snapshot.empty) return null;
    let user = null;
    snapshot.forEach(doc => { user = { id: doc.id, ...doc.data() }; });
    return user;
  }

  async findByAdminNumber(adminNumber) {
    if (!adminNumber) return null;
    const snapshot = await this.collection.where('admin_number', '==', adminNumber.trim()).limit(1).get();
    if (snapshot.empty) return null;
    let user = null;
    snapshot.forEach(doc => { user = { id: doc.id, ...doc.data() }; });
    return user;
  }

  async createUser(userData) {
    const docRef = await this.collection.add({
      ...userData,
      email: userData.email.toLowerCase().trim(),
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...userData };
  }

  async getAllUsers() {
    const snapshot = await this.collection.get();
    const users = [];
    snapshot.forEach(doc => { users.push({ id: doc.id, ...doc.data() }); });
    return users;
  }

  async deleteUser(userId) {
    console.log(`[DELETE] Starting user deletion for userId: ${userId}`);
    
    // Step 1: Find user by userId
    const user = await this.findByUserId(userId);
    if (!user) {
      console.error(`[DELETE] User not found in Firestore with userId: ${userId}`);
      throw new Error('User not found in database');
    }
    
    console.log(`[DELETE] Found user in Firestore:`, {
      firestoreId: user.id,
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });

    // Step 2: Try to delete from Firebase Auth (optional - don't fail if this doesn't work)
    if (user.email) {
      try {
        const normalizedEmail = user.email.toLowerCase().trim();
        console.log(`[DELETE] Looking up user in Firebase Auth with email: ${normalizedEmail}`);
        
        const authUser = await auth.getUserByEmail(normalizedEmail);
        console.log(`[DELETE] Found user in Firebase Auth with uid: ${authUser.uid}`);
        
        await auth.deleteUser(authUser.uid);
        console.log(`[DELETE] Successfully deleted user from Firebase Auth: ${authUser.uid}`);
      } catch (error) {
        console.warn(`[DELETE] Could not delete from Firebase Auth: ${error.code || error.message}`);
        // Don't fail the operation if Firebase Auth deletion fails
      }
    }

    // Step 3: Delete from Firestore (THIS IS CRITICAL)
    try {
      console.log(`[DELETE] Attempting to delete from Firestore with docId: ${user.id}`);
      const docRef = this.collection.doc(user.id);
      await docRef.delete();
      console.log(`[DELETE] Successfully deleted user from Firestore: ${user.id}`);
      
      // Verify deletion
      const checkDoc = await this.collection.doc(user.id).get();
      if (checkDoc.exists) {
        console.error(`[DELETE] WARNING: Document still exists after deletion attempt: ${user.id}`);
        throw new Error('Failed to verify user deletion from database');
      }
      console.log(`[DELETE] Verified: User successfully deleted from Firestore`);
      
    } catch (error) {
      console.error(`[DELETE] Error deleting from Firestore:`, error.message);
      throw new Error(`Database deletion failed: ${error.message}`);
    }

    return true;
  }

  async checkEmailExists(email) {
    return await this.findByEmail(email);
  }
}

module.exports = new UserService();
