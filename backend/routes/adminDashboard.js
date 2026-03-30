const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const adminDashboardController = require('../controllers/adminDashboard');

router.get('/dashboard', authenticate, adminOnly, adminDashboardController.getDashboard);
router.delete('/users/:userId', authenticate, adminOnly, adminDashboardController.deleteUser);

module.exports = router;
