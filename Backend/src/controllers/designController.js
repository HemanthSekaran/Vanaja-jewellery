/**
 * Custom Design Controller
 * Handles custom jewelry design requests.
 *
 * Status model (two columns):
 *   request     : 'Not Viewed' | 'Accepted' | 'Rejected'
 *   work_status : 'Pending' | 'On Progress' | 'Completed'
 */

const { query } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { sendDesignCreatedNotification } = require('../utils/emailService');

/**
 * @desc    Create custom design request
 * @route   POST /api/designs
 * @access  Private (User)
 */
const createDesign = async (req, res, next) => {
    try {
        const { design_name, material_preference, approximate_weight, description } = req.body;
        const userId = req.user.id;

        if (!design_name || !material_preference || !approximate_weight || !description) {
            return next(new AppError('Design name, material preference, weight, and description are required', 400));
        }

        if (isNaN(parseFloat(approximate_weight)) || parseFloat(approximate_weight) <= 0) {
            return next(new AppError('Please provide a valid approximate weight', 400));
        }

        const reference_images = req.files ? req.files.map(f => f.filename) : [];

        const result = await query(
            `INSERT INTO custom_designs
             (user_id, design_name, material_preference, approximate_weight,
              description, reference_images, request, work_status)
             VALUES (?, ?, ?, ?, ?, ?, 'Not Viewed', 'Pending')`,
            [
                userId,
                design_name,
                material_preference,
                approximate_weight,
                description || null,
                JSON.stringify(reference_images)
            ]
        );

        const designs = await query('SELECT * FROM custom_designs WHERE id = ?', [result.insertId]);
        const design = designs[0];

        if (design.reference_images) {
            design.reference_images = JSON.parse(design.reference_images);
        }

        logger.info(`Custom design created by user ${userId}: ${design_name} (${reference_images.length} images)`);

        const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length > 0) {
            sendDesignCreatedNotification(design, users[0]).catch(() => {});
        }

        sendSuccess(res, { design }, 'Custom design request submitted successfully', 201);
    } catch (error) {
        logger.error('Create design error:', error);
        next(error);
    }
};

/**
 * @desc    Get all designs for logged-in user
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

        designs.forEach(design => {
            if (design.reference_images) {
                design.reference_images = JSON.parse(design.reference_images);
            }
        });

        sendSuccess(res, { designs, count: designs.length }, 'Designs retrieved successfully');
    } catch (error) {
        logger.error('Get user designs error:', error);
        next(error);
    }
};

/**
 * @desc    Get single design
 * @route   GET /api/designs/:id
 * @access  Private (User – own; Admin – all)
 */
const getDesign = async (req, res, next) => {
    try {
        const designId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        const designs = await query('SELECT * FROM custom_designs WHERE id = ?', [designId]);

        if (designs.length === 0) {
            return next(new AppError('Design not found', 404));
        }

        const design = designs[0];

        if (userRole !== 'admin' && design.user_id !== userId) {
            return next(new AppError('Not authorized to access this design', 403));
        }

        if (design.reference_images) {
            design.reference_images = JSON.parse(design.reference_images);
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
            `SELECT cd.*, u.name AS user_name, u.email AS user_email
             FROM custom_designs cd
             JOIN users u ON cd.user_id = u.id
             ORDER BY cd.created_at DESC`
        );

        designs.forEach(design => {
            if (design.reference_images) {
                design.reference_images = JSON.parse(design.reference_images);
            }
        });

        sendSuccess(res, { designs, count: designs.length }, 'All designs retrieved successfully');
    } catch (error) {
        logger.error('Get all designs error:', error);
        next(error);
    }
};

/**
 * @desc    Update design request and/or work_status (Admin only)
 * @route   PUT /api/designs/:id/status
 * @access  Private (Admin)
 *
 * Body:
 *   request     (optional): 'Not Viewed' | 'Accepted' | 'Rejected'
 *   work_status (optional): 'Pending' | 'On Progress' | 'Completed'
 *
 * When request === 'Accepted', alert_sent is reset to FALSE so future alerts
 * restart cleanly.
 */
const updateDesignStatus = async (req, res, next) => {
    try {
        const designId = req.params.id;
        const { request, work_status } = req.body;

        const VALID_REQUEST    = ['Not Viewed', 'Accepted', 'Rejected'];
        const VALID_WORK_STATUS = ['Pending', 'On Progress', 'Completed'];

        if (request !== undefined && !VALID_REQUEST.includes(request)) {
            return next(new AppError(`request must be one of: ${VALID_REQUEST.join(', ')}`, 400));
        }
        if (work_status !== undefined && !VALID_WORK_STATUS.includes(work_status)) {
            return next(new AppError(`work_status must be one of: ${VALID_WORK_STATUS.join(', ')}`, 400));
        }
        if (request === undefined && work_status === undefined) {
            return next(new AppError('Please provide request and/or work_status to update', 400));
        }

        // Check design exists
        const existing = await query('SELECT id FROM custom_designs WHERE id = ?', [designId]);
        if (existing.length === 0) {
            return next(new AppError('Design not found', 404));
        }

        const updates = [];
        const values = [];

        if (request !== undefined) {
            updates.push('request = ?');
            values.push(request);
            // Reset alert_sent whenever admin makes a decision
            updates.push('alert_sent = FALSE');
        }
        if (work_status !== undefined) {
            updates.push('work_status = ?');
            values.push(work_status);
        }

        values.push(designId);
        await query(`UPDATE custom_designs SET ${updates.join(', ')} WHERE id = ?`, values);

        const designs = await query('SELECT * FROM custom_designs WHERE id = ?', [designId]);
        const design = designs[0];
        if (design.reference_images) {
            design.reference_images = JSON.parse(design.reference_images);
        }

        logger.info(`Design ${designId} updated – request: ${request ?? '(unchanged)'}, work_status: ${work_status ?? '(unchanged)'}`);

        sendSuccess(res, { design }, 'Design status updated successfully');
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
