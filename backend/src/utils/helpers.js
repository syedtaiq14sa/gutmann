const { v4: uuidv4 } = require('uuid');
const { SLA_HOURS, STATUS_LABELS, BOTTLENECK_THRESHOLD_DAYS } = require('../config/constants');

/**
 * Generate a unique inquiry number: INQ-YYYYMMDD-XXXX
 */
function generateInquiryNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INQ-${dateStr}-${suffix}`;
}

/**
 * Calculate SLA deadline for a stage
 */
function calculateSLADeadline(stage, startTime = new Date()) {
  const hours = SLA_HOURS[stage];
  if (!hours) return null;
  const deadline = new Date(startTime);
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

/**
 * Check if a project is past its SLA
 */
function isSLABreached(stage, updatedAt) {
  const hours = SLA_HOURS[stage];
  if (!hours) return false;
  const stageStart = new Date(updatedAt);
  const now = new Date();
  const elapsedHours = (now - stageStart) / (1000 * 60 * 60);
  return elapsedHours > hours;
}

/**
 * Check if a project is a bottleneck
 */
function isBottleneck(updatedAt, thresholdDays = BOTTLENECK_THRESHOLD_DAYS) {
  const stageStart = new Date(updatedAt);
  const now = new Date();
  const daysDiff = (now - stageStart) / (1000 * 60 * 60 * 24);
  return daysDiff > thresholdDays;
}

/**
 * Get human-readable status label
 */
function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

/**
 * Calculate profit margin percentage
 */
function calculateProfitMargin(finalPrice, estimatedCost) {
  if (!finalPrice || !estimatedCost || estimatedCost === 0) return 0;
  return ((finalPrice - estimatedCost) / estimatedCost) * 100;
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
}

/**
 * Paginate results
 */
function paginate(query, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  return { from: offset, to: offset + limit - 1 };
}

/**
 * Sanitize input to remove dangerous characters
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Build date range filter for queries
 */
function getDateRange(range) {
  const now = new Date();
  switch (range) {
    case 'week':
      return new Date(now.setDate(now.getDate() - 7)).toISOString();
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    case 'quarter':
      return new Date(now.setMonth(now.getMonth() - 3)).toISOString();
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
    default:
      return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
  }
}

module.exports = {
  generateInquiryNumber,
  calculateSLADeadline,
  isSLABreached,
  isBottleneck,
  getStatusLabel,
  calculateProfitMargin,
  formatCurrency,
  paginate,
  sanitizeInput,
  getDateRange
};
