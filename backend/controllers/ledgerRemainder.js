const ledgerRemainderService = require('../services/ledgerRemainder');
exports.list = async (req, res) => {
  try {
    const rows = await ledgerRemainderService.list({ limit: req.query.limit });
    
    res.json({
      rows,
      count: rows.length,
      columns: ['ledger_id', 'ledger_name', 'city'],
    });
  } catch (error) {
    console.error('Error listing ledger remainders:', error);
    res.status(500).json({
      message: 'Failed to fetch ledger remainders',
      error: error.message,
    });
  }
};

