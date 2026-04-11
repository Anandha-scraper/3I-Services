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
      console.log('[upsertFromExcelRecords] No remainders to upsert');
      return { inserted: 0, updated: 0 };
    }

    const { userId, fileName } = meta;
    const importedAt = new Date().toISOString();
    let inserted = 0;
    let updated = 0;

    console.log('[upsertFromExcelRecords] Processing', remainders.length, 'ledger remainder records');

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
          // Create new entry with empty nextCallDate for user to populate
          ref = this.collection.doc();
          const newEntry = {
            ...remainder,
            // Ensure nextCallDate is initialized as empty
            nextCallDate: remainder.nextCallDate || '',
            createdAt: importedAt,
            createdByUserId: userId || null,
            sourceFileName: fileName || null,
            updatedAt: importedAt,
          };
          console.log('[upsertFromExcelRecords] Creating new record:', remainder.ledger_id, 'with empty nextCallDate');
          batch.set(ref, newEntry);
          inserted += 1;
        } else {
          // Update existing entry - preserve nextCallDate if it was already set
          ref = snapshot.docs[0].ref;
          const existingData = snapshot.docs[0].data();
          const updateData = {
            ...remainder,
            // Preserve existing nextCallDate if user has set it
            nextCallDate: existingData.nextCallDate !== undefined ? existingData.nextCallDate : (remainder.nextCallDate || ''),
            // Preserve existing debit/credit values set by outstanding upload
            debit: (existingData.debit !== undefined && existingData.debit !== null && existingData.debit !== 0)
              ? existingData.debit
              : (remainder.debit || 0),
            credit: (existingData.credit !== undefined && existingData.credit !== null && existingData.credit !== 0)
              ? existingData.credit
              : (remainder.credit || 0),
            updatedAt: importedAt,
            sourceFileName: fileName || null,
          };
          console.log('[upsertFromExcelRecords] Updating record:', remainder.ledger_id, 'preserving nextCallDate:', updateData.nextCallDate, 'debit:', updateData.debit, 'credit:', updateData.credit);
          batch.update(ref, updateData);
          updated += 1;
        }
      }

      await batch.commit();
    }

    console.log('[upsertFromExcelRecords] Complete - Inserted:', inserted, 'Updated:', updated);
    return { inserted, updated };
  }

  async list(opts = {}) {
    const raw = opts.limit != null ? parseInt(String(opts.limit), 10) : 500;
    const limit = Math.min(Math.max(Number.isNaN(raw) ? 500 : raw, 1), 2000);
    const city = opts.city ? String(opts.city).trim().toLowerCase() : null;

    try {
      let query = this.collection;
      if (city) {
        query = query.where('city', '==', city);
      }
      const snapshot = await query
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .get();

      console.log('Ledger Remainder list - found', snapshot.docs.length, 'documents', city ? `(city: ${city})` : '(all cities)');
      return this._processLedgerDocs(snapshot.docs);
    } catch (error) {
      console.warn('updatedAt ordering failed, using fallback:', error.message);
      let query = this.collection;
      if (city) {
        query = query.where('city', '==', city);
      }
      const snapshot = await query.limit(limit).get();

      console.log('Ledger Remainder list (fallback) - found', snapshot.docs.length, 'documents');
      return this._processLedgerDocs(snapshot.docs);
    }
  }

  async getUpcomingRemainders(opts = {}) {
    const days = opts.days || 7;
    const resultLimit = opts.limit != null ? Math.min(parseInt(String(opts.limit), 10) || 50, 200) : 50;
    const city = opts.city ? String(opts.city).trim().toLowerCase() : null;

    // YYYY-MM-DD strings sort lexicographically — Firestore can range-filter them directly.
    // Required Firestore indexes:
    //   - Single field: nextCallDate (ASC)
    //   - Composite (city filter): city (ASC), nextCallDate (ASC)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);
    const endDateStr = endDate.toISOString().split('T')[0];

    console.log('[getUpcomingRemainders] range:', todayStr, '→', endDateStr, city ? `city: ${city}` : 'all cities');

    try {
      let query = this.collection
        .where('nextCallDate', '>=', todayStr)
        .where('nextCallDate', '<=', endDateStr)
        .orderBy('nextCallDate', 'asc')
        .limit(resultLimit);

      if (city) {
        // Composite index required: (city ASC, nextCallDate ASC)
        query = this.collection
          .where('city', '==', city)
          .where('nextCallDate', '>=', todayStr)
          .where('nextCallDate', '<=', endDateStr)
          .orderBy('nextCallDate', 'asc')
          .limit(resultLimit);
      }

      const snapshot = await query.get();
      console.log('[getUpcomingRemainders] Firestore returned', snapshot.size, 'docs (was 2000 before)');

      // Batch user lookups — collect unique updatedByUserId refs, fetch in one shot
      const docs = snapshot.docs;
      const userIds = [...new Set(docs.map(d => d.data().updatedByUserId).filter(Boolean))];
      const userMap = {};
      if (userIds.length > 0) {
        const userRefs = userIds.map(uid => db.collection('users').doc(uid));
        const userDocs = await db.getAll(...userRefs);
        for (const ud of userDocs) {
          if (ud.exists) userMap[ud.id] = ud.data().firstName || '-';
        }
      }

      const seen = new Set();
      const rows = [];
      for (const doc of docs) {
        const data = doc.data();
        const ledgerId = String(data.ledger_id || '').trim();
        if (seen.has(ledgerId)) continue;
        seen.add(ledgerId);

        rows.push({
          id: doc.id,
          ...data,
          firstName: userMap[data.updatedByUserId] || '-',
          debit: data.debit != null ? parseFloat(data.debit) : 0,
          credit: data.credit != null ? parseFloat(data.credit) : 0,
          group: data.group || '-',
          // lastComments is already stored on the record — no cross-collection fetch needed
        });
      }

      console.log('[getUpcomingRemainders] ✓ returning', rows.length, 'rows');
      return rows;
    } catch (error) {
      console.error('[getUpcomingRemainders] Error:', error.message);
      // If the Firestore index is missing the query will throw — fall back to the safe list
      if (error.message && error.message.includes('index')) {
        console.warn('[getUpcomingRemainders] Missing Firestore index — create composite index (city ASC, nextCallDate ASC) and single-field index (nextCallDate ASC) in Firebase Console');
      }
      return [];
    }
  }

  async _processLedgerDocs(docs) {
    const rows = [];
    for (const doc of docs) {
      const data = doc.data();
      const row = {
        id: doc.id,
        ...data,
        firstName: '-',
        // Ensure debit and credit are always present with defaults
        debit: data.debit !== undefined && data.debit !== null ? parseFloat(data.debit) : 0,
        credit: data.credit !== undefined && data.credit !== null ? parseFloat(data.credit) : 0,
        // Ensure group is present
        group: data.group || '-',
      };

      // Fetch user information if updatedByUserId exists
      if (data.updatedByUserId) {
        try {
          const userDoc = await db.collection('users').doc(data.updatedByUserId).get();
          if (userDoc.exists) {
            row.firstName = userDoc.data().firstName || '-';
          }
        } catch (error) {
          console.error('Error fetching user info for', data.updatedByUserId, ':', error.message);
        }
      }

      rows.push(row);
    }
    
    console.log('Ledger Remainder list - returning', rows.length, 'rows');
    if (rows.length > 0) {
      console.log('Sample row:', rows[0]);
    }
    return rows;
  }

  async getByLedgerId(ledger_id) {
    const snapshot = await this.collection
      .where('ledger_id', '==', String(ledger_id).trim())
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    const row = {
      id: doc.id,
      ...data,
      firstName: '-',
      debit: data.debit !== undefined && data.debit !== null ? parseFloat(data.debit) : 0,
      credit: data.credit !== undefined && data.credit !== null ? parseFloat(data.credit) : 0,
      group: data.group || '-',
    };
    if (data.updatedByUserId) {
      try {
        const userDoc = await db.collection('users').doc(data.updatedByUserId).get();
        if (userDoc.exists) row.firstName = userDoc.data().firstName || '-';
      } catch (_) { /* non-critical */ }
    }
    return row;
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

  async updateByLedgerId(ledger_id, updateData = {}) {
    try {
      console.log('[LedgerRemainderService] updateByLedgerId called with:', { ledger_id, updateData });
      
      // Find the document by ledger_id
      const snapshot = await this.collection
        .where('ledger_id', '==', String(ledger_id).trim())
        .limit(1)
        .get();

      console.log('[LedgerRemainderService] Query snapshot - found', snapshot.size, 'documents');
      
      if (snapshot.empty) {
        console.log('[LedgerRemainderService] No documents found for ledger_id:', ledger_id);
        throw new Error(`Ledger not found for id: ${ledger_id}`);
      }

      const docRef = snapshot.docs[0].ref;
      const docData = snapshot.docs[0].data();
      console.log('[LedgerRemainderService] Found document:', { docId: snapshot.docs[0].id, ledger_id: docData.ledger_id });

      const updatePayload = {
        updatedAt: new Date().toISOString(),
      };

      // Copy all fields from updateData to updatePayload
      // This ensures all customer fields and other fields are included
      Object.keys(updateData).forEach(key => {
        updatePayload[key] = updateData[key];
      });

      console.log('[LedgerRemainderService] Complete updatePayload:', JSON.stringify(updatePayload, null, 2));

      // Perform the update with error handling
      try {
        await docRef.update(updatePayload);
        console.log('[LedgerRemainderService] Firestore update successful for ledger:', ledger_id);

        // Log which fields were updated
        const updatedFields = Object.keys(updatePayload).filter(key => updatePayload[key] !== null && updatePayload[key] !== undefined);
        console.log('[LedgerRemainderService] Updated fields:', updatedFields);

        // Verify the update by reading the document
        const verifyDoc = await docRef.get();
        if (verifyDoc.exists) {
          const verifyData = verifyDoc.data();
          console.log('[LedgerRemainderService] Verification - Stored data:', {
            cname1: verifyData.cname1,
            cmob1: verifyData.cmob1,
            cemail1: verifyData.cemail1,
            cname2: verifyData.cname2,
            cmob2: verifyData.cmob2,
            cemail2: verifyData.cemail2,
            cname3: verifyData.cname3,
            cmob3: verifyData.cmob3,
            cemail3: verifyData.cemail3,
            updatedAt: verifyData.updatedAt
          });
        }
      } catch (updateError) {
        console.error('[LedgerRemainderService] Firestore update error:', updateError);
        throw updateError;
      }

      const updatedDoc = await docRef.get();
      return {
        success: true,
        data: {
          id: updatedDoc.id,
          ...updatedDoc.data(),
        },
      };
    } catch (error) {
      console.error('[LedgerRemainderService] Error updating ledger remainder:', error.message);
      throw error;
    }
  }
}

module.exports = new LedgerRemainderService();
