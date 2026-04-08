const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const excelMasterController = require('../controllers/excelMaster');
router.get('/master', authenticate, excelMasterController.listMaster);
router.get('/master/:ledger_id', authenticate, excelMasterController.getMasterById);

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

module.exports = router;
