const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post(
  '/',
  authMiddleware,
  [
    body('booking_id', 'Booking ID is required').not().isEmpty(),
    body('amount', 'Amount must be greater than 0').isNumeric({ min: 0.01 }),
    body('method', 'Valid payment method required').isIn(['credit_card', 'paypal', 'bank_transfer'])
  ],
  validate,
  paymentController.processPayment
);

module.exports = router;
