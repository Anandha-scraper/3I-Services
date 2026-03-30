// Verifies JWT tokens and attaches decoded user information to the request object.
const { verifyToken } = require('../utils/jwt');

// Middleware to verify JWT token and attach user info to request
const authenticate = async (req, res, next) => {
  try {
    // Get the token from the Authorization header (Bearer <token>)
    const tokenHeader = req.headers.authorization;

    if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = tokenHeader.split(' ')[1];

    // Verify the JWT token
    const decodedToken = verifyToken(token);

    // Attach user info to request
    req.user = decodedToken;
    next();

  } catch (error) {
    console.error("Authentication Middleware Error:", error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
