const express = require('express');
const router = express.Router();
const { getPendingReviews, submitReview, getSystemTypes } = require('../controllers/TechnicalController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/pending', authenticate, authorize('technical', 'ceo'), getPendingReviews);
router.post('/review', authenticate, authorize('technical'), submitReview);
router.get('/system-types', authenticate, getSystemTypes);

module.exports = router;
