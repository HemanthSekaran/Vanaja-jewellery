/**
 * Custom Design Controller
 * Handles custom jewelry design requests
 */

const { query } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * @desc    Create custom design request
 * @route   POST /api/designs
 * @access  Private (User)
 */
const createDesign = async (req, res, next) => {
    try {
        const { design_name, material_preference, approximate_weight, description } = req.body;
        const userId = req.user.id;

        // Get uploaded file name if exists
        const reference_image = req.file ? req.file.filename : null;

        // Insert design request
        const result = await query(
            `INSERT INTO custom_designs 
            (user_id, design_name, material_preference, approximate_weight, description, reference_image, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, design_name, material_preference, approximate_weight, description || null, reference_image, 'pending']
        );

        // Get created design
        const designs = await query(
            'SELECT * FROM custom_designs WHERE id = ?',
            [result.insertId]
        );

        logger.info(`Custom design created by user ${userId}: ${design_name}`);

        sendSuccess(
            res,
            { design: designs[0] },
            'Custom design request submitted successfully',
            201
        );
    } catch (error) {
        logger.error('Create design error:', error);
        next(error);
    }
};

/**
 * @desc    Get all designs for logged in user
 * @route   GET /api/designs
 * @access  Private (User)
 */
const getUserDesigns = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const designs = await query(
            'SELECT * FROM custom_designs WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        sendSuccess(res, { designs, count: designs.length }, 'Designs retrieved successfully');
    } catch (error) {
        logger.error('Get user designs error:', error);
        next(error);
    }
};

/**
 * @desc    Get single design
 * @route   GET /api/designs/:id
 * @access  Private (User - own designs, Admin - all)
 */
const getDesign = async (req, res, next) => {
    try {
        const designId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        const designs = await query(
            'SELECT * FROM custom_designs WHERE id = ?',
            [designId]
        );

        if (designs.length === 0) {
            return next(new AppError('Design not found', 404));
        }

        const design = designs[0];

        // Check authorization - user can only see their own designs, admin can see all
        if (userRole !== 'admin' && design.user_id !== userId) {
            return next(new AppError('Not authorized to access this design', 403));
        }

        sendSuccess(res, { design }, 'Design retrieved successfully');
    } catch (error) {
        logger.error('Get design error:', error);
        next(error);
    }
};

/**
 * @desc    Get all designs (Admin only)
 * @route   GET /api/designs/admin/all
 * @access  Private (Admin)
 */
const getAllDesigns = async (req, res, next) => {
    try {
        const designs = await query(
            `SELECT cd.*, u.name as user_name, u.email as user_email 
            FROM custom_designs cd 
            JOIN users u ON cd.user_id = u.id 
            ORDER BY cd.created_at DESC`
        );

        sendSuccess(res, { designs, count: designs.length }, 'All designs retrieved successfully');
    } catch (error) {
        logger.error('Get all designs error:', error);
        next(error);
    }
};

/**
 * @desc    Update design status (Admin only)
 * @route   PUT /api/designs/:id/status
 * @access  Private (Admin)
 */
const updateDesignStatus = async (req, res, next) => {
    try {
        const designId = req.params.id;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'in_progress', 'completed', 'rejected'];
        if (!validStatuses.includes(status)) {
            return next(new AppError('Invalid status value', 400));
        }

        await query(
            'UPDATE custom_designs SET status = ? WHERE id = ?',
            [status, designId]
        );

        const designs = await query(
            'SELECT * FROM custom_designs WHERE id = ?',
            [designId]
        );

        if (designs.length === 0) {
            return next(new AppError('Design not found', 404));
        }

        logger.info(`Design ${designId} status updated to ${status}`);

        sendSuccess(res, { design: designs[0] }, 'Design status updated successfully');
    } catch (error) {
        logger.error('Update design status error:', error);
        next(error);
    }
};

module.exports = {
    createDesign,
    getUserDesigns,
    getDesign,
    getAllDesigns,
    updateDesignStatus
};
