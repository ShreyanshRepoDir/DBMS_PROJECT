const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/score/:propertyId', reviewController.getLivingScore);
router.get('/:propertyId', reviewController.getReviews);

router.post(
  '/',
  authMiddleware,
  [
    body('booking_id', 'Booking ID is required').not().isEmpty(),
    body('rating_food', 'Must be between 1 and 10').isInt({ min: 1, max: 10 }),
    body('rating_wifi', 'Must be between 1 and 10').isInt({ min: 1, max: 10 }),
    body('rating_safety', 'Must be between 1 and 10').isInt({ min: 1, max: 10 }),
    body('rating_study_env', 'Must be between 1 and 10').isInt({ min: 1, max: 10 }),
    body('rating_water', 'Must be between 1 and 10').isInt({ min: 1, max: 10 }),
    body('rating_cleanliness', 'Must be between 1 and 10').isInt({ min: 1, max: 10 }),
    body('comment').optional().isString()
  ],
  validate,
  reviewController.addReview
);

module.exports = router;
