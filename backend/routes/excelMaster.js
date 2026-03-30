const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const excelMasterController = require('../controllers/excelMaster');

router.get('/master', authenticate, excelMasterController.listMaster);

router.post(
  '/master/upload',
  authenticate,
  excelMasterController.runUpload,
  excelMasterController.uploadMaster
);

router.post(
  '/outstanding/upload',
  authenticate,
  excelMasterController.runUpload,
  excelMasterController.uploadOutstanding
);

module.exports = router;
