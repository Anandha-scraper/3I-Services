const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/password');

router.post('/send-otp', passwordController.sendOtp);
router.post('/resend-otp', passwordController.resendOtp);
router.post('/verify-otp', passwordController.verifyOtp);
router.post('/reset', passwordController.reset);

module.exports = router;
