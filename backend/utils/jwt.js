const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET ;
const JWT_EXPIRES_IN = '7d';

const generateToken = (userId, email, role = 'employee', firstName = '') => {
  return jwt.sign(
    { userId, email, role, firstName, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

const decodeToken = (token) => jwt.decode(token);

module.exports = { generateToken, verifyToken, decodeToken, JWT_SECRET };
