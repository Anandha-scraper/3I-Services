const XLSX = require('xlsx');
const {
  EXCEL_MASTER_FIELDS,
  ALLOWED_FIELD_SET,
  normalizeHeaderName,
  pickMasterFields,
  isRowEmpty,
} = require('../models/excelMaster');

function cellToString(cell) {
  if (cell == null || cell === '') return '';
  if (typeof cell === 'number' && !Number.isNaN(cell)) return String(cell);
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  return String(cell).trim();
}

function parseExcelMasterBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: false });
  if (!workbook.SheetNames.length) {
    return { records: [], error: 'Workbook has no sheets' };
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (!matrix.length) {
    return { records: [], error: 'Sheet is empty' };
  }

  const headerRow = matrix[0];
  const colToField = [];
  for (let c = 0; c < headerRow.length; c++) {
    const normalized = normalizeHeaderName(headerRow[c]);
    colToField[c] = ALLOWED_FIELD_SET.has(normalized) ? normalized : null;
  }

  const mappedKeys = colToField.filter(Boolean);
  if (!mappedKeys.length) {
    return {
      records: [],
      error: `No recognized columns. First row must include headers matching: ${EXCEL_MASTER_FIELDS.slice(0, 6).join(', ')}…`,
    };
  }

  const records = [];
  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r];
    const obj = {};
    for (let c = 0; c < row.length; c++) {
      const field = colToField[c];
      if (!field) continue;
      const val = cellToString(row[c]);
      if (val !== '') obj[field] = val;
    }
    const record = pickMasterFields(obj);
    if (isRowEmpty(record)) continue;
    records.push(record);
  }

  return { records, error: null };
}

module.exports = { parseExcelMasterBuffer };
