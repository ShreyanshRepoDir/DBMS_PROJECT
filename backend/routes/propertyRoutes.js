const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const propertyController = require('../controllers/propertyController');
const authMiddleware = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleCheck');

// Public routes
router.get('/', propertyController.getProperties);
router.get('/:id', propertyController.getPropertyById);

// Agent/Admin routes
router.get('/agent/me', authMiddleware, roleCheck(['agent']), propertyController.getMyProperties);

router.post(
  '/',
  authMiddleware,
  roleCheck(['agent', 'admin']),
  [
    body('title', 'Title is required').not().isEmpty(),
    body('city', 'City is required').not().isEmpty(),
    body('price', 'Valid price is required').isNumeric({ min: 1 }),
    body('type', 'Valid type is required').isIn(['apartment', 'house', 'villa', 'commercial'])
  ],
  validate,
  propertyController.createProperty
);

router.put('/:id', authMiddleware, roleCheck(['agent', 'admin']), propertyController.updateProperty);
router.delete('/:id', authMiddleware, roleCheck(['agent', 'admin']), propertyController.deleteProperty);

module.exports = router;
