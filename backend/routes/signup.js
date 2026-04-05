const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const signupController = require('../controllers/signup');
const { sendEmailToAdmin } = require('../utils/mailer');

// Public
router.post('/register', signupController.register);

// Admin
router.get('/pending', authenticate, adminOnly, signupController.getPending);
router.get('/requests', authenticate, adminOnly, signupController.getAll);
router.put('/approve/:id', authenticate, adminOnly, signupController.approve);
router.put('/reject/:id', authenticate, adminOnly, signupController.reject);

module.exports = router;
