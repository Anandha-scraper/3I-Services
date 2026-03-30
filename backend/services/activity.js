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
    const snapshot = await this.collection.where('userId', '==', userId).get();
    if (snapshot.empty) return null;

    const activities = [];
    snapshot.forEach(doc => { activities.push({ id: doc.id, ...doc.data() }); });
    activities.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return activities[0] || null;
  }
}

module.exports = new ActivityService();
