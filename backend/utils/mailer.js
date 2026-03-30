const nodemailer = require('nodemailer');
require('dotenv').config();

const createTransporter = () => {
  const config = {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  };

  if (process.env.EMAIL_HOST) {
    config.host = process.env.EMAIL_HOST;
    config.port = parseInt(process.env.EMAIL_PORT || '465');
    config.secure = process.env.EMAIL_SECURE === 'true';
    config.tls = { ciphers: 'SSLv3', rejectUnauthorized: false };
    config.connectionTimeout = 10000;
    config.greetingTimeout = 5000;
    config.socketTimeout = 10000;
  } else {
    config.service = process.env.EMAIL_SERVICE || 'gmail';
  }

  return nodemailer.createTransport(config);
};

const sendEmailToAdmin = async ({ requestId, firstName, lastName, email }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.ADMIN_EMAIL) {
    console.log('Email not configured. Skipping admin notification.');
    return;
  }

  const transporter = createTransporter();
  const now = new Date();
  const requestDate = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' });
  const requestTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: 'New Registration Request - Magizh Industries',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 650px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #ffffff; margin: 0;">Magizh Industries</h1>
        </div>
        <div style="padding: 40px 30px; background-color: #f8f9fa;">
          <h2 style="color: #1e3a5f;">New Registration Request</h2>
          <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; border-left: 4px solid #2c5282;">
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Date:</strong> ${requestDate}</p>
            <p><strong>Time:</strong> ${requestTime}</p>
          </div>
        </div>
      </div>
    `
  });
};

const sendCredentialsEmail = async ({ email, firstName, userId, password }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured. Skipping credentials email.');
    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Account Has Been Approved - Magizh Industries',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 650px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #ffffff; margin: 0;">Magizh Industries</h1>
        </div>
        <div style="padding: 40px 30px; background-color: #f8f9fa;">
          <h2 style="color: #10b981;">Welcome, ${firstName}!</h2>
          <p>Your registration has been approved. Here are your login credentials:</p>
          <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; border-left: 4px solid #10b981;">
            <p><strong>User ID:</strong> <code>${userId}</code></p>
            <p><strong>Password:</strong> <code>${password}</code></p>
          </div>
        </div>
      </div>
    `
  });
};

const sendOtpEmail = async ({ email, firstName, otp }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured. Skipping OTP email.');
    return;
  }

  const transporter = createTransporter();
  const otpValiditySeconds = parseInt(process.env.OTP_VALID_TIME) || 120;
  const otpValidityMinutes = Math.floor(otpValiditySeconds / 60);
  const validityText = otpValidityMinutes >= 1 ? `${otpValidityMinutes} minute${otpValidityMinutes > 1 ? 's' : ''}` : `${otpValiditySeconds} seconds`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset OTP - Magizh Industries',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 650px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #ffffff; margin: 0;">Magizh Industries</h1>
        </div>
        <div style="padding: 40px 30px; background-color: #f8f9fa;">
          <h2 style="color: #1e3a5f;">Password Reset Request</h2>
          <p>Hello${firstName ? ` ${firstName}` : ''}, use this OTP to reset your password:</p>
          <div style="background: linear-gradient(135deg, #2c5282 0%, #1e3a5f 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <span style="color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 8px;">${otp}</span>
            <p style="color: rgba(255, 255, 255, 0.8); margin: 15px 0 0 0;">Valid for ${validityText}</p>
          </div>
        </div>
      </div>
    `
  });
};

module.exports = { sendEmailToAdmin, sendCredentialsEmail, sendOtpEmail };
