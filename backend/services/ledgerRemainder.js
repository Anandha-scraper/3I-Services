const { db } = require('../config/firebase');
const {
  LEDGER_REMAINDER_COLLECTION_NAME,
  extractUniqueLedgerRemainders,
} = require('../models/ledgerRemainder');

const BATCH_MAX = 400;

class LedgerRemainderService {
  constructor() {
    this.collection = db.collection(LEDGER_REMAINDER_COLLECTION_NAME);
  }

  async upsertFromExcelRecords(records, meta = {}) {
    const remainders = extractUniqueLedgerRemainders(records);
    
    if (!remainders.length) {
      return { inserted: 0, updated: 0 };
    }

    const { userId, fileName } = meta;
    const importedAt = new Date().toISOString();
    let inserted = 0;
    let updated = 0;

    for (let i = 0; i < remainders.length; i += BATCH_MAX) {
      const batch = db.batch();
      const chunk = remainders.slice(i, i + BATCH_MAX);

      for (const remainder of chunk) {
        // Query existing record by ledger_id
        const snapshot = await this.collection
          .where('ledger_id', '==', remainder.ledger_id)
          .limit(1)
          .get();

        let ref;
        if (snapshot.empty) {
          // Create new entry
          ref = this.collection.doc();
          batch.set(ref, {
            ...remainder,
            createdAt: importedAt,
            createdByUserId: userId || null,
            sourceFileName: fileName || null,
            updatedAt: importedAt,
          });
          inserted += 1;
        } else {
          // Update existing entry
          ref = snapshot.docs[0].ref;
          batch.update(ref, {
            ...remainder,
            updatedAt: importedAt,
            sourceFileName: fileName || null,
          });
          updated += 1;
        }
      }

      await batch.commit();
    }

    return { inserted, updated };
  }

  async list(opts = {}) {
    const raw = opts.limit != null ? parseInt(String(opts.limit), 10) : 500;
    const limit = Math.min(Math.max(Number.isNaN(raw) ? 500 : raw, 1), 2000);
    const snapshot = await this.collection
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get();
    
    const rows = [];
    snapshot.forEach((doc) => {
      rows.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return rows;
  }

  async delete(id) {
    try {
      await this.collection.doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting ledger remainder:', error);
      return false;
    }
  }
}

module.exports = new LedgerRemainderService();
