const { db } = require('../config/firebase');
const { COLLECTION_NAME, pickMasterFields } = require('../models/excelMaster');
const ledgerRemainderService = require('./ledgerRemainder');

const BATCH_MAX = 400;

class ExcelMasterService {
  constructor() {
    this.collection = db.collection(COLLECTION_NAME);
  }
  async bulkInsert(rows, meta) {
    if (!rows.length) return 0;
    const { userId, fileName } = meta;
    const importedAt = new Date().toISOString();
    let inserted = 0;

    for (let i = 0; i < rows.length; i += BATCH_MAX) {
      const batch = db.batch();
      const chunk = rows.slice(i, i + BATCH_MAX);
      for (const row of chunk) {
        const ref = this.collection.doc();
        batch.set(ref, {
          ...row,
          importedAt,
          importedByUserId: userId || null,
          sourceFileName: fileName || null,
        });
        inserted += 1;
      }
      await batch.commit();
    }

    // After inserting Excel master records, populate Ledger_Remainder collection
    try {
      await ledgerRemainderService.upsertFromExcelRecords(rows, meta);
    } catch (error) {
      console.error('Error populating Ledger_Remainder:', error);
      // Continue even if ledger remainder fails to not break the upload
    }

    return inserted;
  }

  async list(opts = {}) {
    const raw = opts.limit != null ? parseInt(String(opts.limit), 10) : 500;
    const limit = Math.min(Math.max(Number.isNaN(raw) ? 500 : raw, 1), 2000);
    const snapshot = await this.collection.orderBy('importedAt', 'desc').limit(limit).get();
    const rows = [];
    snapshot.forEach((doc) => {
      rows.push(pickMasterFields(doc.data()));
    });
    return rows;
  }
}

module.exports = new ExcelMasterService();
