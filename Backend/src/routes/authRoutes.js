/**
 * Authentication Routes – OTP-based (no passwords)
 */

const express = require('express');
const router = express.Router();
const {
    register,
    verifyRegisterOtp,
    login,
    verifyLoginOtp,
    getMe,
    updateProfile
} = require('../controllers/authController');
const {
    validateRegister,
    validateVerifyOtp,
    validateLoginEmail,
    validateUpdateProfile
} = require('../middleware/validators');
const { protect } = require('../middleware/auth');

// ------ Registration (2-step) ------
router.post('/register', validateRegister, register);
router.post('/register/verify', validateVerifyOtp, verifyRegisterOtp);

// ------ Login (2-step) ------
router.post('/login', validateLoginEmail, login);
router.post('/login/verify', validateVerifyOtp, verifyLoginOtp);

// ------ Protected ------
router.get('/me', protect, getMe);
router.put('/profile', protect, validateUpdateProfile, updateProfile);

module.exports = router;
