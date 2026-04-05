const { auth } = require('../config/firebase');
const { generateToken } = require('../utils/jwt');
const { setSession, deleteSession } = require('../utils/sessionCache');
const userService = require('../services/user');
const activityService = require('../services/activity');
const https = require('https');
const ms = require('ms');

const EXPIRES_IN = process.env.JWT_EXPIRES_IN ;
const COOKIE_OPTIONS = {
  httpOnly: true,                                        // not accessible via JS (XSS protection)
  secure: process.env.NODE_ENV === 'production',         // HTTPS only in production
  sameSite: 'strict',                                    // CSRF protection
  maxAge: ms(EXPIRES_IN),                               // matches JWT expiry (ms in milliseconds)
};

// Login user
exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }

    const user = await userService.findByUserId(userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify user exists in Firebase Auth
    try {
      await auth.getUserByEmail(user.email);
    } catch (authError) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password with Firebase REST API
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      console.error('FIREBASE_API_KEY not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const signInResult = await verifyPassword(user.email, password, apiKey);
    if (!signInResult.success) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.userId, user.email, user.role || 'employee', user.firstName || '', (user.city || '').toLowerCase().trim());
    setSession(user.userId, token); // store in session cache — overwrites any prior session

    // Record login activity (non-blocking)
    activityService.recordLogin(user.userId).catch(err => {
      console.warn('Failed to record login activity:', err.message);
    });

    // Set token as HttpOnly cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(200).json({
      message: 'Login successful',
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || 'employee',
        city: (user.city || '').toLowerCase().trim()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

// Get user sessions
exports.getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const lastLogin = await activityService.getLastLogin(userId);
    res.status(200).json({ userId, lastLogin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout user — invalidates session in cache and clears cookie
exports.logout = async (req, res) => {
  try {
    deleteSession(req.user.userId);
    res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: 0 });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

// Helper: Verify password with Firebase REST API
function verifyPassword(email, password, apiKey) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ email, password, returnSecureToken: true });

    const req = https.request({
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signInWithPassword?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ success: res.statusCode === 200, data: JSON.parse(data) });
        } catch { resolve({ success: false }); }
      });
    });

    req.on('error', () => resolve({ success: false }));
    req.write(postData);
    req.end();
  });
}
