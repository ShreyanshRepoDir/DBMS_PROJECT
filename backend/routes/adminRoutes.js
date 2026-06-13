const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleCheck');

router.get(
  '/dashboard',
  authMiddleware,
  roleCheck(['admin']),
  adminController.getDashboardStats
);

router.get(
  '/bookings',
  authMiddleware,
  roleCheck(['admin']),
  adminController.getAllBookings
);

module.exports = router;
