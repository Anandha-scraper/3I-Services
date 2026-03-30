const LEDGER_REMAINDER_FIELDS = [
  'ledger_id',
  'ledger_name',
  'city',
  'debit',
  'credit',
  'lastTransactionDate',
  'lastComments',
  'lastUpdatedAt',
  'updatedByUserId',
  'sourceFileName',
];

const LEDGER_REMAINDER_COLLECTION_NAME = 'Ledger_Remainder';
/**
 * Create a Ledger_Remainder entry with optional date and comments fields
 * @param {string} ledger_id - Unique ledger identifier
 * @param {string} ledger_name - Full ledger name
 * @param {string} city - City/location
 * @param {number} debit - Debit amount
 * @param {number} credit - Credit amount
 * @param {string} date - Transaction date (YYYY-MM-DD format, optional)
 * @param {string} comments - Transaction comments (optional)
 */
function createLedgerRemainderEntry(ledger_id, ledger_name, city, debit = 0, credit = 0, date = null, comments = null) {
  const entry = {
    ledger_id: String(ledger_id || '').trim(),
    ledger_name: String(ledger_name || '').trim(),
    city: String(city || '').trim(),
    debit: parseFloat(debit || 0) || 0,
    credit: parseFloat(credit || 0) || 0,
  };
  
  // Add optional date and comments if provided
  if (date && String(date).trim()) {
    entry.lastTransactionDate = String(date).trim();
  }
  if (comments && String(comments).trim()) {
    entry.lastComments = String(comments).trim();
  }
  
  return entry;
}

function extractUniqueLedgerRemainders(records) {
  const seen = new Set();
  const remainders = [];

  for (const record of records) {
    const ledger_id = String(record.ledger_id || '').trim();
    
    // Skip if no ledger_id
    if (!ledger_id) continue;
    
    // Skip if we've already seen this ledger_id
    if (seen.has(ledger_id)) continue;
    
    seen.add(ledger_id);
    
    const entry = createLedgerRemainderEntry(
      record.ledger_id,
      record.ledger,
      record.city
    );
    
    // Only add if ledger_name exists
    if (entry.ledger_name) {
      remainders.push(entry);
    }
  }

  return remainders;
}

module.exports = {
  LEDGER_REMAINDER_FIELDS,
  LEDGER_REMAINDER_COLLECTION_NAME,
  createLedgerRemainderEntry,
  extractUniqueLedgerRemainders,
};
