/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { validateRegister, validateLogin, validateUpdateProfile } = require('../middleware/validators');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, validateUpdateProfile, updateProfile);

module.exports = router;
