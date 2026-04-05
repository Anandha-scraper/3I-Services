const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const excelMasterController = require('../controllers/excelMaster');
const clearDataController = require('../controllers/clearData');

router.get('/master', authenticate, adminOnly, excelMasterController.listMaster);

router.post(
  '/master/upload',
  authenticate,
  adminOnly,
  excelMasterController.runUpload,
  excelMasterController.uploadMaster
);

router.post(
  '/outstanding/upload',
  authenticate,
  adminOnly,
  excelMasterController.runUpload,
  excelMasterController.uploadOutstanding
);

// Clear data endpoints
router.delete('/clear/master', authenticate, adminOnly, clearDataController.clearMaster);
router.delete('/clear/remainder', authenticate, adminOnly, clearDataController.clearRemainder);
router.delete('/clear/logs', authenticate, adminOnly, clearDataController.clearLogs);
router.delete('/clear/all', authenticate, adminOnly, clearDataController.clearAll);

module.exports = router;
