const express = require('express');
const router = express.Router();
const { getProjects, getProjectById, createProject, updateProjectStatus } = require('../controllers/ProjectController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getProjects);
router.get('/:id', authenticate, getProjectById);
router.post('/', authenticate, authorize('salesperson', 'ceo'), createProject);
router.patch('/:id/status', authenticate, updateProjectStatus);

module.exports = router;
