const express = require('express');
const router = express.Router();
const { getPendingEstimations, submitQuotation, updateQuotation } = require('../controllers/EstimationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/pending', authenticate, authorize('estimation', 'ceo'), getPendingEstimations);
router.post('/quotation', authenticate, authorize('estimation'), submitQuotation);
router.patch('/quotation/:id', authenticate, authorize('estimation', 'ceo'), updateQuotation);

module.exports = router;
