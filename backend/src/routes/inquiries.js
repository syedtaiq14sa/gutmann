const express = require('express');
const router = express.Router();
const {
  createInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
  getInquiryHistory,
  moveToStage
} = require('../controllers/InquiryController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateInquiry, validateId } = require('../middleware/validation');

router.post('/', authenticate, authorize('salesperson'), validateInquiry, createInquiry);
router.get('/', authenticate, getAllInquiries);
router.get('/:id', authenticate, validateId, getInquiryById);
router.put('/:id', authenticate, authorize('salesperson'), validateId, validateInquiry, updateInquiry);
router.delete('/:id', authenticate, authorize('salesperson'), validateId, deleteInquiry);
router.get('/:id/history', authenticate, validateId, getInquiryHistory);
router.put('/:id/stage', authenticate, validateId, moveToStage);

module.exports = router;
