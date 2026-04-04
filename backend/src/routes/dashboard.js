const express = require('express');
const router = express.Router();
const { getProjects, getTasks, getReports } = require('../controllers/DashboardController');
const { authenticate } = require('../middleware/auth');

router.get('/projects', authenticate, getProjects);
router.get('/tasks', authenticate, getTasks);
router.get('/reports', authenticate, getReports);

module.exports = router;
