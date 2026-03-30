const { db } = require('../config/firebase');

class RegistrationService {
  constructor() {
    this.collection = db.collection('requests');
  }

  async createRequest(data) {
    const docRef = await this.collection.add({
      ...data,
      email: data.email.toLowerCase().trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...data };
  }

  async findById(id) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async findByEmail(email) {
    const snapshot = await this.collection.where('email', '==', email.toLowerCase().trim()).get();
    const requests = [];
    snapshot.forEach(doc => { requests.push({ id: doc.id, ...doc.data() }); });
    return requests;
  }

  async findByEmailAndStatus(email, status) {
    const snapshot = await this.collection
      .where('email', '==', email.toLowerCase().trim())
      .where('status', '==', status)
      .get();
    const requests = [];
    snapshot.forEach(doc => { requests.push({ id: doc.id, ...doc.data() }); });
    return requests;
  }

  async findByPhone(phone) {
    if (!phone) return [];
    const snapshot = await this.collection.where('phone', '==', phone.trim()).get();
    const requests = [];
    snapshot.forEach(doc => { requests.push({ id: doc.id, ...doc.data() }); });
    return requests;
  }

  async getPendingRequests() {
    const snapshot = await this.collection.where('status', '==', 'pending').get();
    const requests = [];
    snapshot.forEach(doc => { requests.push({ id: doc.id, ...doc.data() }); });
    return requests;
  }

  async getAllRequests() {
    const snapshot = await this.collection.get();
    const requests = [];
    snapshot.forEach(doc => { requests.push({ id: doc.id, ...doc.data() }); });
    return requests;
  }

  async updateStatus(id, status) {
    await this.collection.doc(id).update({ status, updatedAt: new Date().toISOString() });
  }

  async deleteRequest(id) {
    await this.collection.doc(id).delete();
  }
}

module.exports = new RegistrationService();
