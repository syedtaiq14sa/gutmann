const express = require('express');
const router = express.Router();
const {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiry,
  getInquiryHistory,
  moveToStage
} = require('../controllers/InquiryController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateInquiry, validateId } = require('../middleware/validation');

router.post('/', authenticate, validateInquiry, createInquiry);
router.get('/', authenticate, getAllInquiries);
router.get('/:id', authenticate, validateId, getInquiryById);
router.put('/:id', authenticate, validateId, updateInquiry);
router.get('/:id/history', authenticate, validateId, getInquiryHistory);
router.put('/:id/stage', authenticate, validateId, moveToStage);

module.exports = router;
