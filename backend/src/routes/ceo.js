const express = require('express');
const router = express.Router();
const { getPendingApprovals, approveQuotation, getAnalytics } = require('../controllers/CEOController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/pending', authenticate, authorize('ceo'), getPendingApprovals);
router.post('/approve', authenticate, authorize('ceo'), approveQuotation);
router.get('/analytics', authenticate, authorize('ceo'), getAnalytics);

module.exports = router;
