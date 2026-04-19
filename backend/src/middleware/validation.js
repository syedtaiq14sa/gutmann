const { body, param, query, validationResult } = require('express-validator');

// Return validation errors as a 400 response
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Inquiry validation rules
const validateInquiry = [
  body('client_name').trim().notEmpty().withMessage('Client name is required'),
  body('client_email').isEmail().withMessage('Valid client email is required'),
  body('client_phone').optional().trim(),
  body('project_type').trim().notEmpty().withMessage('Project type is required'),
  body('project_description').trim().notEmpty().withMessage('Project description is required'),
  body('location').optional().trim(),
  body('budget_range').optional().trim(),
  handleValidationErrors
];

// QC review validation rules
const validateQCReview = [
  body('inquiry_id').notEmpty().withMessage('Inquiry ID is required'),
  body('decision').isIn(['approved', 'rejected']).withMessage('Decision must be approved or rejected'),
  body('remarks').optional().trim(),
  handleValidationErrors
];

// Technical review validation rules
const validateTechnicalReview = [
  body('inquiry_id').notEmpty().withMessage('Inquiry ID is required'),
  body('decision').isIn(['approved', 'rejected']).withMessage('Decision must be approved or rejected'),
  body('system_type').optional().trim(),
  body('feasibility').optional().trim(),
  body('estimated_duration').optional().isNumeric().withMessage('Estimated duration must be a number'),
  handleValidationErrors
];

// Quotation validation rules
const validateQuotation = [
  body('inquiry_id').notEmpty().withMessage('Inquiry ID is required'),
  body('estimated_cost').isFloat({ min: 0 }).withMessage('Estimated cost must be a positive number'),
  body('final_price').isFloat({ min: 0 }).withMessage('Final price must be a positive number'),
  body('validity_days').optional().isInt({ min: 1 }).withMessage('Validity days must be a positive integer'),
  handleValidationErrors
];

// CEO approval validation rules
const validateCEODecision = [
  body('inquiry_id').notEmpty().withMessage('Inquiry ID is required'),
  body('decision').isIn(['approved', 'rejected', 'revision']).withMessage('Invalid decision'),
  body('notes').optional().trim(),
  handleValidationErrors
];

// Login validation rules
const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// ID param validation
const validateId = [
  param('id').notEmpty().withMessage('ID is required'),
  handleValidationErrors
];

module.exports = {
  validateInquiry,
  validateQCReview,
  validateTechnicalReview,
  validateQuotation,
  validateCEODecision,
  validateLogin,
  validateId,
  handleValidationErrors
};
