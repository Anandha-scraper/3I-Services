const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const authenticate = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/sessions/:userId', authController.getUserSessions);

module.exports = router;
