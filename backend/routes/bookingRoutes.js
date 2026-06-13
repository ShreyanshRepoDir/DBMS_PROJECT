const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

router.post(
  '/',
  authMiddleware,
  [
    body('property_id', 'Property ID is required').not().isEmpty(),
    body('start_date', 'Start date is required').isDate(),
    body('end_date', 'End date is required').isDate()
  ],
  validate,
  bookingController.createBooking
);

router.get('/my', authMiddleware, bookingController.getMyBookings);

// Allow users/agents to update status (cancel, etc)
router.put('/:id/status', authMiddleware, bookingController.updateBookingStatus);

module.exports = router;
