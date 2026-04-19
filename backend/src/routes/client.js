const express = require('express');
const router = express.Router();
const {
  getMyQuotations,
  acceptQuotation,
  rejectQuotation,
  requestNegotiation,
  getProjectStatus
} = require('../controllers/ClientController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/quotations', authenticate, getMyQuotations);
router.post('/:id/accept', authenticate, acceptQuotation);
router.post('/:id/reject', authenticate, rejectQuotation);
router.post('/:id/negotiate', authenticate, requestNegotiation);
router.get('/status', authenticate, getProjectStatus);

module.exports = router;
