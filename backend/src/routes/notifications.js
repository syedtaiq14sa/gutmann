const express = require('express');
const router = express.Router();
const { getNotifications, markRead, markAllRead } = require('../controllers/NotificationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, markRead);
router.patch('/read-all', authenticate, markAllRead);

module.exports = router;
