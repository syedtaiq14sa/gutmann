const { ROLES } = require('../config/constants');

/**
 * Enhanced role-based access control middleware.
 * Usage: roleCheck('ceo', 'qc')  - allow multiple roles
 */
const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * CEO-only access
 */
const ceoOnly = roleCheck(ROLES.CEO);

/**
 * Sales team access (CEO + Salesperson)
 */
const salesAccess = roleCheck(ROLES.CEO, ROLES.SALESPERSON);

/**
 * QC department access
 */
const qcAccess = roleCheck(ROLES.CEO, ROLES.QC);

/**
 * Technical department access
 */
const technicalAccess = roleCheck(ROLES.CEO, ROLES.TECHNICAL);

/**
 * Estimation department access
 */
const estimationAccess = roleCheck(ROLES.CEO, ROLES.ESTIMATION);

/**
 * Internal staff access (all roles except client)
 */
const internalAccess = roleCheck(ROLES.CEO, ROLES.SALESPERSON, ROLES.QC, ROLES.TECHNICAL, ROLES.ESTIMATION);

/**
 * Client-only access
 */
const clientOnly = roleCheck(ROLES.CLIENT);

/**
 * Check if the user owns the resource or is a CEO
 */
const ownerOrCeo = (resourceUserId) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (req.user.role === ROLES.CEO || req.user.id === resourceUserId) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: you do not own this resource' });
};

module.exports = {
  roleCheck,
  ceoOnly,
  salesAccess,
  qcAccess,
  technicalAccess,
  estimationAccess,
  internalAccess,
  clientOnly,
  ownerOrCeo
};
