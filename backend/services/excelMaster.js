const { db } = require('../config/firebase');
const { COLLECTION_NAME, pickMasterFields } = require('../models/excelMaster');
const ledgerRemainderService = require('./ledgerRemainder');

const BATCH_MAX = 400;

class ExcelMasterService {
  constructor() {
    this.collection = db.collection(COLLECTION_NAME);
  }
  async bulkInsert(rows, meta) {
    if (!rows.length) return { inserted: 0, updated: 0 };
    const { userId, fileName } = meta;
    const importedAt = new Date().toISOString();
    let inserted = 0;
    let updated = 0;

    // Deduplicate uploaded rows by ledger_id (last entry wins)
    const uniqueRowsMap = new Map();
    for (const row of rows) {
      if (row.ledger_id) {
        uniqueRowsMap.set(row.ledger_id, row);
      }
    }

    // Fetch existing ledger_ids and their document refs from the database
    const existingDocRefs = new Map(); // ledger_id -> docRef
    const ledgerIds = Array.from(uniqueRowsMap.keys());

    for (let i = 0; i < ledgerIds.length; i += 30) {
      const idBatch = ledgerIds.slice(i, i + 30);
      const snapshot = await this.collection.where('ledger_id', 'in', idBatch).get();
      snapshot.forEach(doc => {
        existingDocRefs.set(doc.data().ledger_id, doc.ref);
      });
    }

    // Partition into new inserts and existing updates
    const rowsToInsert = [];
    const rowsToUpdate = [];
    for (const [ledgerId, row] of uniqueRowsMap) {
      if (existingDocRefs.has(ledgerId)) {
        rowsToUpdate.push({ row, ref: existingDocRefs.get(ledgerId) });
      } else {
        rowsToInsert.push(row);
      }
    }

    // Insert new records
    for (let i = 0; i < rowsToInsert.length; i += BATCH_MAX) {
      const batch = db.batch();
      const chunk = rowsToInsert.slice(i, i + BATCH_MAX);
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

    // Update existing records (all fields except ledger_id)
    for (let i = 0; i < rowsToUpdate.length; i += BATCH_MAX) {
      const batch = db.batch();
      const chunk = rowsToUpdate.slice(i, i + BATCH_MAX);
      for (const { row, ref } of chunk) {
        const { ledger_id, ...fieldsToUpdate } = row;
        batch.update(ref, {
          ...fieldsToUpdate,
          importedAt,
          importedByUserId: userId || null,
          sourceFileName: fileName || null,
        });
        updated += 1;
      }
      await batch.commit();
    }

    // Populate Ledger_Remainder for all rows (both inserted and updated)
    const allRows = [...rowsToInsert, ...rowsToUpdate.map(r => r.row)];
    try {
      await ledgerRemainderService.upsertFromExcelRecords(allRows, meta);
    } catch (error) {
      console.error('Error populating Ledger_Remainder:', error);
    }

    return { inserted, updated };
  }

  async list(opts = {}) {
    const raw = opts.limit != null ? parseInt(String(opts.limit), 10) : 500;
    const limit = Math.min(Math.max(Number.isNaN(raw) ? 500 : raw, 1), 2000);
    const snapshot = await this.collection.orderBy('importedAt', 'desc').limit(limit).get();
    const rows = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const picked = pickMasterFields(data);
      // Include ledger_id directly from document if present
      if (data.ledger_id) {
        picked.ledger_id = data.ledger_id;
      }
      rows.push(picked);
    });
    return rows;
  }
}

module.exports = new ExcelMasterService();
