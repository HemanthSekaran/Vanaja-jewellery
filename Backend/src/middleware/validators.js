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

    body('grams')
        .trim()
        .notEmpty().withMessage('Grams is required')
        .isLength({ max: 50 }).withMessage('Grams cannot exceed 50 characters'),

    body('wastage')
        .notEmpty().withMessage('Wastage is required')
        .isInt({ min: 0 }).withMessage('Wastage must be a non-negative integer'),

    body('category')
        .trim()
        .notEmpty().withMessage('Category is required')
        .isLength({ min: 2, max: 100 }).withMessage('Category must be between 2 and 100 characters'),

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

    body('grams')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Grams cannot exceed 50 characters'),

    body('wastage')
        .optional()
        .isInt({ min: 0 }).withMessage('Wastage must be a non-negative integer'),

    body('category')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Category must be between 2 and 100 characters'),

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
 * ID Parameter Validation
 */
const validateId = [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid ID'),

    handleValidationErrors
];

module.exports = {
    validateRegister,
    validateLogin,
    validateCustomDesign,
    validateProduct,
    validateProductUpdate,
    validateId
};
