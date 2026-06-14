const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const transferController = require('../controllers/transferController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/marketplace', transferController.getMarketplace);

router.post(
  '/list',
  authMiddleware,
  [
    body('booking_id', 'Booking ID is required').not().isEmpty(),
    body('reason', 'Reason is required').not().isEmpty()
  ],
  validate,
  transferController.listTransfer
);

router.post(
  '/request',
  authMiddleware,
  [body('transfer_id', 'Transfer ID is required').not().isEmpty()],
  validate,
  transferController.requestTransfer
);

router.get('/requests/pending', authMiddleware, transferController.getPendingRequests);

router.post(
  '/approve',
  authMiddleware,
  [body('request_id', 'Request ID is required').not().isEmpty()],
  validate,
  transferController.approveTransfer
);

module.exports = router;
