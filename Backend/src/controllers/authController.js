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

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
    try {
        const { name, email, phone, password } = req.body;

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
        const token = generateToken(user.id);

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

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
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
        const token = generateToken(user.id);

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

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
    try {
        sendSuccess(res, { user: sanitizeUser(req.user) }, 'User retrieved successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe
};
