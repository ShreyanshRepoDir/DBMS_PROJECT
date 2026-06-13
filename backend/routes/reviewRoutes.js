const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/:propertyId', reviewController.getReviews);

router.post(
  '/',
  authMiddleware,
  [
    body('booking_id', 'Booking ID is required').not().isEmpty(),
    body('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
    body('comment').optional().isString()
  ],
  validate,
  reviewController.addReview
);

module.exports = router;
