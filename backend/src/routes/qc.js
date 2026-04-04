const express = require('express');
const router = express.Router();
const { getPendingReviews, submitReview, getReviewHistory } = require('../controllers/QCController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/pending', authenticate, authorize('qc', 'ceo'), getPendingReviews);
router.post('/review', authenticate, authorize('qc'), submitReview);
router.get('/history/:inquiry_id', authenticate, getReviewHistory);

module.exports = router;
