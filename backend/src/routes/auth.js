const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, refreshToken } = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.post('/refresh-token', authenticate, refreshToken);

module.exports = router;