const { admin } = require('../config/firebase');
const { sendOtpEmail } = require('../utils/mailer');
const userService = require('../services/user');
const otpService = require('../services/otp');
const crypto = require('crypto');

const OTP_VALID_TIME = parseInt(process.env.OTP_VALID_TIME) || 120;
const OTP_RESEND_TIME = parseInt(process.env.OTP_RESEND_TIME) || 60;

// Generate 6-digit OTP
const generateOtp = () => crypto.randomInt(100000, 999999).toString();

// Send OTP for password reset
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await userService.findByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'Email not found' });

    // Check cooldown
    const recentOtp = await otpService.findMostRecent(email);
    if (recentOtp) {
      const timeElapsed = Math.floor((new Date() - recentOtp.createdAt.toDate()) / 1000);
      const timeRemaining = OTP_RESEND_TIME - timeElapsed;
      if (timeRemaining > 0) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${timeRemaining}s before requesting another OTP`,
          timeRemaining: `${timeRemaining}s`
        });
      }
    }

    const otp = generateOtp();
    await otpService.create(email, otp);

    sendOtpEmail({ email, firstName: user.firstName || '', otp }).catch(err => {
      console.error('Failed to send OTP email:', err);
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otpExpirationSeconds: OTP_VALID_TIME,
      resendOtpSeconds: OTP_RESEND_TIME
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// Resend OTP
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await userService.findByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'Email not found' });

    // Check cooldown
    const recentOtp = await otpService.findMostRecent(email);
    if (recentOtp) {
      const timeElapsed = Math.floor((new Date() - recentOtp.createdAt.toDate()) / 1000);
      const timeRemaining = OTP_RESEND_TIME - timeElapsed;
      if (timeRemaining > 0) {
        return res.status(429).json({ success: false, message: `Wait ${timeRemaining}s`, timeRemaining: `${timeRemaining}s` });
      }
    }

    await otpService.deleteByEmail(email);
    const otp = generateOtp();
    await otpService.create(email, otp);

    sendOtpEmail({ email, firstName: user.firstName || '', otp }).catch(() => {});

    res.status(200).json({ success: true, message: 'OTP resent', otpExpirationSeconds: OTP_VALID_TIME });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const isValid = await otpService.verify(email, otp);
    if (!isValid) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    res.status(200).json({ success: true, message: 'OTP verified' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// Reset password (after OTP verification)
exports.reset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const isValid = await otpService.verify(email, otp);
    if (!isValid) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    const user = await userService.findByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Update password in Firebase Auth
    const firebaseUser = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(firebaseUser.uid, { password: newPassword });

    await otpService.deleteByEmail(email);

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// Cleanup expired OTPs (called by scheduler)
exports.cleanupExpired = async () => {
  return await otpService.cleanupExpired();
};
