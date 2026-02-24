/**
 * Input Validation Middleware using express-validator
 */

const { body, param, validationResult } = require('express-validator');
const { sendError } = require('../utils/helpers');

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, 'Validation failed', 400, errors.array());
    }
    next();
};

/**
 * User Registration Validation
 */
const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^[0-9]{10}$/).withMessage('Phone number must be 10 digits'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    handleValidationErrors
];

/**
 * User Login Validation
 */
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),

    handleValidationErrors
];

/**
 * Custom Design Validation
 */
const validateCustomDesign = [
    body('design_name')
        .trim()
        .notEmpty().withMessage('Design name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Design name must be between 2 and 255 characters'),

    body('material_preference')
        .trim()
        .notEmpty().withMessage('Material preference is required')
        .isLength({ min: 2, max: 255 }).withMessage('Material preference must be between 2 and 255 characters'),

    body('approximate_weight')
        .notEmpty().withMessage('Approximate weight is required')
        .isFloat({ min: 0.1 }).withMessage('Approximate weight must be a positive number'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

    handleValidationErrors
];

/**
 * Product Validation
 */
const validateProduct = [
    body('name')
        .trim()
        .notEmpty().withMessage('Product name is required')
        .isLength({ min: 2, max: 255 }).withMessage('Product name must be between 2 and 255 characters'),

    body('weight')
        .optional()
        .isFloat({ min: 0 }).withMessage('Weight must be a non-negative number'),

    body('waste_id')
        .notEmpty().withMessage('Waste ID is required')
        .isInt({ min: 1 }).withMessage('Waste ID must be a positive integer'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

    body('availability')
        .optional()
        .isIn(['YES', 'NO']).withMessage('Availability must be either YES or NO'),

    handleValidationErrors
];

/**
 * Product Update Validation (all fields optional)
 */
const validateProductUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 }).withMessage('Product name must be between 2 and 255 characters'),

    body('weight')
        .optional()
        .isFloat({ min: 0 }).withMessage('Weight must be a non-negative number'),

    body('waste_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Waste ID must be a positive integer'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

    body('availability')
        .optional()
        .isIn(['YES', 'NO']).withMessage('Availability must be either YES or NO'),

    body('top_selling')
        .optional()
        .isBoolean().withMessage('Top selling must be a boolean value'),

    body('featured')
        .optional()
        .isBoolean().withMessage('Featured must be a boolean value'),

    handleValidationErrors
];

/**
 * Update User Profile Validation
 */
const validateUpdateProfile = [
    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9]{10}$/).withMessage('Phone number must be 10 digits'),

    body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 500 }).withMessage('Address must be between 5 and 500 characters'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

    body('wishlist')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if (!Array.isArray(parsed)) {
                        throw new Error('Wishlist must be an array');
                    }
                    return true;
                } catch (e) {
                    throw new Error('Wishlist must be a valid JSON array');
                }
            } else if (Array.isArray(value)) {
                return true;
            }
            throw new Error('Wishlist must be an array or JSON string');
        }),

    body('add_to_cart')
        .optional()
        .custom((value) => {
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if (!Array.isArray(parsed)) {
                        throw new Error('Cart must be an array');
                    }
                    return true;
                } catch (e) {
                    throw new Error('Cart must be a valid JSON array');
                }
            } else if (Array.isArray(value)) {
                return true;
            }
            throw new Error('Cart must be an array or JSON string');
        }),

    handleValidationErrors
];

/**
 * ID Parameter Validation
 */
const validateId = [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid ID'),

    handleValidationErrors
];

/**
 * Metal Price Update Validation
 */
const validateMetalPriceUpdate = [
    param('metalName')
        .trim()
        .notEmpty().withMessage('Metal name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Metal name must be between 2 and 100 characters'),

    body('price')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0.01 }).withMessage('Price must be a positive number'),

    handleValidationErrors
];

/**
 * Wastage Validation
 */
const validateWastage = [
    body('jewel_type')
        .trim()
        .notEmpty().withMessage('Jewel type is required')
        .isLength({ min: 2, max: 50 }).withMessage('Jewel type must be between 2 and 50 characters'),

    body('wastage')
        .notEmpty().withMessage('Wastage is required')
        .isFloat({ min: 0, max: 100 }).withMessage('Wastage must be a number between 0 and 100'),

    handleValidationErrors
];

/**
 * Wastage Update Validation (all fields optional)
 */
const validateWastageUpdate = [
    body('jewel_type')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Jewel type must be between 2 and 50 characters'),

    body('wastage')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('Wastage must be a number between 0 and 100'),

    handleValidationErrors
];

/**
 * Checkout Validation
 */
const validateCheckout = [
    body('productIds')
        .notEmpty().withMessage('Product IDs are required')
        .isArray({ min: 1 }).withMessage('Product IDs must be a non-empty array')
        .custom((value) => {
            if (!value.every(id => Number.isInteger(id) && id > 0)) {
                throw new Error('All product IDs must be positive integers');
            }
            return true;
        }),

    handleValidationErrors
];

/**
 * Order Status Update Validation
 */
const validateOrderStatusUpdate = [
    body('status')
        .trim()
        .notEmpty().withMessage('Status is required')
        .isIn(['pending', 'acknowledge', 'completed', 'rejected'])
        .withMessage('Status must be one of: pending, acknowledge, completed, rejected'),

    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validateCustomDesign,
    validateProduct,
    validateProductUpdate,
    validateUpdateProfile,
    validateId,
    validateMetalPriceUpdate,
    validateWastage,
    validateWastageUpdate,
    validateCheckout,
    validateOrderStatusUpdate
};
