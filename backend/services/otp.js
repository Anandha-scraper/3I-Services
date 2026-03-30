const { db } = require('../config/firebase');

const OTP_VALID_TIME = parseInt(process.env.OTP_VALID_TIME) || 120;

class OtpService {
  constructor() {
    this.collection = db.collection('otps');
  }

  async create(email, otp) {
    const normalizedEmail = email.toLowerCase().trim();
    await this.deleteByEmail(normalizedEmail);

    const docRef = await this.collection.add({
      email: normalizedEmail,
      otp: otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + OTP_VALID_TIME * 1000)
    });
    return docRef.id;
  }

  async findValidOtp(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    const snapshot = await this.collection.where('email', '==', normalizedEmail).get();
    if (snapshot.empty) return null;

    const validOtps = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.expiresAt.toDate() > now) {
        validOtps.push({ id: doc.id, ...data, expiresAt: data.expiresAt.toDate() });
      }
    });

    if (validOtps.length === 0) return null;
    validOtps.sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime());
    return validOtps[0];
  }

  async findMostRecent(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const snapshot = await this.collection.where('email', '==', normalizedEmail).get();
    if (snapshot.empty) return null;

    const allOtps = [];
    snapshot.forEach(doc => { allOtps.push({ id: doc.id, ...doc.data() }); });
    allOtps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return allOtps[0];
  }

  async verify(email, otp) {
    const otpRecord = await this.findValidOtp(email);
    if (!otpRecord) return false;
    return String(otpRecord.otp) === String(otp);
  }

  async deleteByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const snapshot = await this.collection.where('email', '==', normalizedEmail).get();

    const batch = db.batch();
    snapshot.forEach(doc => { batch.delete(doc.ref); });
    await batch.commit();
  }

  async cleanupExpired() {
    const snapshot = await this.collection.where('expiresAt', '<=', new Date()).get();
    const batch = db.batch();
    snapshot.forEach(doc => { batch.delete(doc.ref); });
    await batch.commit();
    return snapshot.size;
  }
}

module.exports = new OtpService();
