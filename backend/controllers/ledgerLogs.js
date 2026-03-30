const ledgerLogsService = require('../services/ledgerLogs');

/**
 * Get all logs
 */
exports.list = async (req, res) => {
  try {
    const logs = await ledgerLogsService.list({ limit: req.query.limit });

    res.json({
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error('Error listing logs:', error);
    res.status(500).json({
      message: 'Failed to fetch logs',
      error: error.message,
    });
  }
};

/**
 * Get logs for a specific ledger
 */
exports.getByLedgerId = async (req, res) => {
  try {
    const { ledger_id } = req.params;

    if (!ledger_id) {
      return res.status(400).json({ message: 'ledger_id is required' });
    }

    const logs = await ledgerLogsService.getLogsByLedgerId(ledger_id, {
      limit: req.query.limit,
    });

    res.json({
      ledger_id,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error('Error fetching logs for ledger:', error);
    res.status(500).json({
      message: 'Failed to fetch logs',
      error: error.message,
    });
  }
};
