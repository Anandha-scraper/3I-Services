const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const ledgerRemainderController = require('../controllers/ledgerRemainder');

router.get('/', authenticate, ledgerRemainderController.list);

module.exports = router;
