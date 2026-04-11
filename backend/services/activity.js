const { db } = require('../config/firebase');

class ActivityService {
  constructor() {
    this.collection = db.collection('loginActivities');
  }

  async recordLogin(userId) {
    const now = new Date();
    await this.collection.add({
      userId,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      timestamp: now.toISOString()
    });
    await this.cleanup(userId);
  }

  async cleanup(userId) {
    const snapshot = await this.collection.where('userId', '==', userId).get();
    if (snapshot.size <= 2) return;

    const activities = [];
    snapshot.forEach(doc => {
      activities.push({ ref: doc.ref, timestamp: doc.data().timestamp || '' });
    });

    activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    await Promise.all(activities.slice(2).map(a => a.ref.delete()));
  }

  async getLastLogin(userId) {
    // Requires Firestore index: (userId ASC, timestamp DESC) on loginActivities
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
}

module.exports = new ActivityService();
