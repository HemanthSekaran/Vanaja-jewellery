/**
 * Authentication Controller
 * Handles user registration and login
 */

const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { sendSuccess, sendError, sanitizeUser } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { use } = require('react');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        const { name, email, phone, address, password } = req.body;
        console.log(req.body);
        // Check if user already exists
        const existingUsers = await query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return next(new AppError('User with this email already exists', 400));
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await query(
            'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, hashedPassword, 'user']
        );

        // Get created user
        const users = await query(
            'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        const user = users[0];

        // Generate token
        const token = generateToken(user.id, user.name, user.email, user.phone, user.role);

        logger.info(`New user registered: ${email}`);

        sendSuccess(
            res,
            {
                user: sanitizeUser(user),
                token
            },
            'User registered successfully',
            201
        );
    } catch (error) {
        logger.error('Registration error:', error);
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const users = await query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return next(new AppError('Invalid credentials', 401));
        }

        const user = users[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return next(new AppError('Invalid credentials', 401));
        }

        // Generate token
        const token = generateToken(user.id, user.name, user.email, user.phone, user.role);

        logger.info(`User logged in: ${email}`);

        sendSuccess(
            res,
            {
                user: sanitizeUser(user),
                token
            },
            'Login successful'
        );
    } catch (error) {
        logger.error('Login error:', error);
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        sendSuccess(res, { user: sanitizeUser(req.user) }, 'User retrieved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
    try {
        const { phone, address, name, wishlist, add_to_cart } = req.body;
        const userId = req.user.id;

        // Check if at least one field is provided
        if (!phone && !address && !name && !wishlist && !add_to_cart) {
            return next(new AppError('Please provide at least one field to update', 400));
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }

        if (phone) {
            updates.push('phone = ?');
            values.push(phone);
        }

        if (address) {
            updates.push('address = ?');
            values.push(address);
        }

        if (wishlist !== undefined) {
            updates.push('wishlist = ?');
            // Convert array to JSON string if it's an array
            const wishlistValue = Array.isArray(wishlist) ? JSON.stringify(wishlist) : wishlist;
            values.push(wishlistValue);
        }

        if (add_to_cart !== undefined) {
            updates.push('add_to_cart = ?');
            // Convert array to JSON string if it's an array
            const cartValue = Array.isArray(add_to_cart) ? JSON.stringify(add_to_cart) : add_to_cart;
            values.push(cartValue);
        }

        // Add userId to values array
        values.push(userId);

        // Update user
        await query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Get updated user
        const users = await query(
            'SELECT id, name, email, phone, address, wishlist, add_to_cart, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        const user = users[0];

        logger.info(`User profile updated: ${user.email}`);

        sendSuccess(
            res,
            { user: sanitizeUser(user) },
            'Profile updated successfully'
        );
    } catch (error) {
        logger.error('Update profile error:', error);
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateProfile
};
