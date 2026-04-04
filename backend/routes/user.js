const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const userController = require('../controllers/user');

// Protected routes
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/password', authenticate, userController.changePassword);

// Admin routes
router.get('/all', authenticate, adminOnly, userController.getAll);
router.get('/:userId', authenticate, adminOnly, userController.getById);
router.delete('/:userId', authenticate, adminOnly, userController.delete);

module.exports = router;
