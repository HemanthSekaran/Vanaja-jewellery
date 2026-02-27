/**
 * Authentication Controller
 * OTP-based authentication – no passwords.
 *
 * Register flow:
 *   POST /api/auth/register        → create user (unverified) + send OTP
 *   POST /api/auth/register/verify → verify OTP  → return JWT
 *
 * Login flow:
 *   POST /api/auth/login           → send OTP to registered email
 *   POST /api/auth/login/verify    → verify OTP  → return JWT
 */

const crypto = require('crypto');
const { query } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { sendSuccess, sanitizeUser } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { sendOtpEmail } = require('../utils/emailService');

// OTP validity window in minutes
const OTP_TTL_MINUTES = 10;

/** Generate a 6-digit numeric OTP */
const generateOtp = () =>
    String(Math.floor(100000 + crypto.randomInt(900000))).padStart(6, '0');

// ---------------------------------------------------------------------------
// REGISTER  – step 1: create (or re-use) account, send OTP
// ---------------------------------------------------------------------------
const register = async (req, res, next) => {
    try {
        const { name, email, phone, address } = req.body;

        if (!name || !email || !phone || !address) {
            return next(new AppError('Name, email, phone, and address are required', 400));
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new AppError('Please provide a valid email address', 400));
        }

        // Check if user already exists (and is already verified → duplicate)
        const existingUsers = await query('SELECT id, is_verified FROM users WHERE email = ?', [email]);

        if (existingUsers.length > 0 && existingUsers[0].is_verified) {
            return next(new AppError('An account with this email already exists. Please log in instead.', 400));
        }

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

        if (existingUsers.length > 0) {
            // Update the pending (unverified) record with fresh OTP
            await query(
                'UPDATE users SET name = ?, phone = ?, otp_code = ?, otp_expires_at = ? WHERE email = ?',
                [name, phone, otp, expiresAt, email]
            );
        } else {
            // Create new unverified user
            await query(
                `INSERT INTO users (name, email, phone, address, role, is_verified, otp_code, otp_expires_at)
                 VALUES (?, ?, ?, ?, 'user', FALSE, ?, ?)`,
                [name, email, phone, address, otp, expiresAt]
            );
        }

        await sendOtpEmail(email, name, otp, 'registration');

        logger.info(`Registration OTP sent to: ${email}`);

        sendSuccess(res, { email }, 'OTP sent to your email. Please verify to complete registration.', 200);
    } catch (error) {
        logger.error('Register error:', error);
        next(error);
    }
};

// ---------------------------------------------------------------------------
// REGISTER  – step 2: verify OTP
// ---------------------------------------------------------------------------
const verifyRegisterOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return next(new AppError('Email and OTP are required', 400));
        }

        const users = await query(
            'SELECT id, name, email, phone, role, otp_code, otp_expires_at, is_verified FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return next(new AppError('No pending registration found for this email', 404));
        }

        const user = users[0];

        if (user.is_verified) {
            return next(new AppError('Account already verified. Please log in.', 400));
        }

        if (!user.otp_code || user.otp_code !== String(otp)) {
            return next(new AppError('Invalid OTP', 400));
        }

        if (new Date() > new Date(user.otp_expires_at)) {
            return next(new AppError('OTP has expired. Please request a new one.', 400));
        }

        // Mark user as verified, clear OTP
        await query(
            'UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
            [user.id]
        );

        const token = generateToken(user.id, user.name, user.email, user.phone, user.role);

        logger.info(`User registered and verified: ${email}`);

        sendSuccess(res, { user: sanitizeUser(user), token }, 'Registration successful', 201);
    } catch (error) {
        logger.error('Verify register OTP error:', error);
        next(error);
    }
};

// ---------------------------------------------------------------------------
// LOGIN  – step 1: send OTP to existing verified user
// ---------------------------------------------------------------------------
const login = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return next(new AppError('Email is required', 400));
        }

        const users = await query(
            'SELECT id, name, email, phone, role, is_verified FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0 || !users[0].is_verified) {
            return next(new AppError('No registered account found for this email', 404));
        }

        const user = users[0];

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

        await query(
            'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
            [otp, expiresAt, user.id]
        );

        await sendOtpEmail(email, user.name, otp, 'login');

        logger.info(`Login OTP sent to: ${email}`);

        sendSuccess(res, { email }, 'OTP sent to your email. Please verify to log in.', 200);
    } catch (error) {
        logger.error('Login error:', error);
        next(error);
    }
};

// ---------------------------------------------------------------------------
// LOGIN  – step 2: verify OTP
// ---------------------------------------------------------------------------
const verifyLoginOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return next(new AppError('Email and OTP are required', 400));
        }

        const users = await query(
            'SELECT id, name, email, phone, role, otp_code, otp_expires_at FROM users WHERE email = ? AND is_verified = TRUE',
            [email]
        );

        if (users.length === 0) {
            return next(new AppError('No registered account found for this email', 404));
        }

        const user = users[0];

        if (!user.otp_code || user.otp_code !== String(otp)) {
            return next(new AppError('Invalid OTP', 400));
        }

        if (new Date() > new Date(user.otp_expires_at)) {
            return next(new AppError('OTP has expired. Please request a new one.', 400));
        }

        // Clear OTP after successful verification
        await query(
            'UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
            [user.id]
        );

        const token = generateToken(user.id, user.name, user.email, user.phone, user.role);

        logger.info(`User logged in via OTP: ${email}`);

        sendSuccess(res, { user: sanitizeUser(user), token }, 'Login successful', 200);
    } catch (error) {
        logger.error('Verify login OTP error:', error);
        next(error);
    }
};

// ---------------------------------------------------------------------------
// GET ME
// ---------------------------------------------------------------------------
const getMe = async (req, res, next) => {
    try {
        sendSuccess(res, { user: sanitizeUser(req.user) }, 'User retrieved successfully');
    } catch (error) {
        next(error);
    }
};

// ---------------------------------------------------------------------------
// UPDATE PROFILE
// ---------------------------------------------------------------------------
const updateProfile = async (req, res, next) => {
    try {
        const { phone, address, name, wishlist, add_to_cart } = req.body;
        const userId = req.user.id;

        if (!phone && !address && !name && !wishlist && !add_to_cart) {
            return next(new AppError('Please provide at least one field to update', 400));
        }

        const updates = [];
        const values = [];

        if (name) { updates.push('name = ?'); values.push(name); }
        if (phone) { updates.push('phone = ?'); values.push(phone); }
        if (address) { updates.push('address = ?'); values.push(address); }

        if (wishlist !== undefined) {
            updates.push('wishlist = ?');
            values.push(Array.isArray(wishlist) ? JSON.stringify(wishlist) : wishlist);
        }

        if (add_to_cart !== undefined) {
            updates.push('add_to_cart = ?');
            values.push(Array.isArray(add_to_cart) ? JSON.stringify(add_to_cart) : add_to_cart);
        }

        values.push(userId);
        await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        const users = await query(
            'SELECT id, name, email, phone, address, wishlist, add_to_cart, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        logger.info(`User profile updated: ${users[0].email}`);

        sendSuccess(res, { user: sanitizeUser(users[0]) }, 'Profile updated successfully');
    } catch (error) {
        logger.error('Update profile error:', error);
        next(error);
    }
};

module.exports = {
    register,
    verifyRegisterOtp,
    login,
    verifyLoginOtp,
    getMe,
    updateProfile
};
