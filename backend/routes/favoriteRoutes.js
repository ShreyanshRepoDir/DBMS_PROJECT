const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const favoriteController = require('../controllers/favoriteController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, favoriteController.getFavorites);

router.post(
  '/',
  authMiddleware,
  [
    body('property_id', 'Property ID is required').not().isEmpty()
  ],
  validate,
  favoriteController.addFavorite
);

router.delete('/:propertyId', authMiddleware, favoriteController.removeFavorite);

module.exports = router;
