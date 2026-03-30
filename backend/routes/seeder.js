const express = require('express');
const router = express.Router();
const seederController = require('../controllers/seeder');

// Seed admin user from env variables
router.post('/admin', seederController.seedAdmin);

// Get all admin users
router.get('/admins', seederController.getAdmins);

module.exports = router;
