/**
 * Wastage Controller
 * Handles CRUD operations for wastage management
 */

const { query } = require('../config/database');
const { sendSuccess } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * @desc    Get all wastages
 * @route   GET /api/wastage
 * @access  Public
 */
const getAllWastages = async (req, res, next) => {
    try {
        const wastages = await query(
            'SELECT * FROM wastage ORDER BY jewel_type ASC'
        );

        sendSuccess(res, { wastages, count: wastages.length }, 'Wastages retrieved successfully');
    } catch (error) {
        logger.error('Get all wastages error:', error);
        next(error);
    }
};

/**
 * @desc    Create new wastage
 * @route   POST /api/wastage
 * @access  Private (Admin)
 */
const createWastage = async (req, res, next) => {
    try {
        const { jewel_type, wastage } = req.body;

        // Check if jewel_type already exists
        const existing = await query(
            'SELECT * FROM wastage WHERE jewel_type = ?',
            [jewel_type]
        );

        if (existing.length > 0) {
            return next(new AppError('Jewel type already exists', 400));
        }

        // Insert new wastage
        const result = await query(
            'INSERT INTO wastage (jewel_type, wastage) VALUES (?, ?)',
            [jewel_type, wastage]
        );

        // Get created wastage
        const newWastage = await query(
            'SELECT * FROM wastage WHERE waste_id = ?',
            [result.insertId]
        );

        logger.info(`Wastage created: ${jewel_type} by admin ${req.user.email}`);

        sendSuccess(
            res,
            { wastage: newWastage[0] },
            'Wastage created successfully',
            201
        );
    } catch (error) {
        logger.error('Create wastage error:', error);
        next(error);
    }
};

/**
 * @desc    Update wastage by waste_id
 * @route   PUT /api/wastage/:id
 * @access  Private (Admin)
 */
const updateWastage = async (req, res, next) => {
    try {
        const wasteId = req.params.id;
        const { jewel_type, wastage } = req.body;

        // Check if wastage exists
        const existing = await query(
            'SELECT * FROM wastage WHERE waste_id = ?',
            [wasteId]
        );

        if (existing.length === 0) {
            return next(new AppError('Wastage not found', 404));
        }

        // Build update query dynamically
        const updates = [];
        const params = [];

        if (jewel_type !== undefined) {
            // Check if new jewel_type already exists (excluding current record)
            const duplicate = await query(
                'SELECT * FROM wastage WHERE jewel_type = ? AND waste_id != ?',
                [jewel_type, wasteId]
            );

            if (duplicate.length > 0) {
                return next(new AppError('Jewel type already exists', 400));
            }

            updates.push('jewel_type = ?');
            params.push(jewel_type);
        }

        if (wastage !== undefined) {
            updates.push('wastage = ?');
            params.push(wastage);
        }

        if (updates.length === 0) {
            return next(new AppError('No fields to update', 400));
        }

        params.push(wasteId);

        await query(
            `UPDATE wastage SET ${updates.join(', ')} WHERE waste_id = ?`,
            params
        );

        // Get updated wastage
        const updated = await query(
            'SELECT * FROM wastage WHERE waste_id = ?',
            [wasteId]
        );

        logger.info(`Wastage ${wasteId} updated by admin ${req.user.email}`);

        sendSuccess(res, { wastage: updated[0] }, 'Wastage updated successfully');
    } catch (error) {
        logger.error('Update wastage error:', error);
        next(error);
    }
};

/**
 * @desc    Delete wastage by waste_id
 * @route   DELETE /api/wastage/:id
 * @access  Private (Admin)
 */
const deleteWastage = async (req, res, next) => {
    try {
        const wasteId = req.params.id;

        // Check if wastage exists
        const existing = await query(
            'SELECT * FROM wastage WHERE waste_id = ?',
            [wasteId]
        );

        if (existing.length === 0) {
            return next(new AppError('Wastage not found', 404));
        }

        // Check if any products are using this wastage
        const productsUsingWastage = await query(
            'SELECT COUNT(*) as count FROM products WHERE waste_id = ?',
            [wasteId]
        );

        if (productsUsingWastage[0].count > 0) {
            return next(new AppError(
                `Cannot delete wastage. ${productsUsingWastage[0].count} product(s) are using this wastage type`,
                400
            ));
        }

        // Delete wastage
        await query('DELETE FROM wastage WHERE waste_id = ?', [wasteId]);

        logger.info(`Wastage ${wasteId} deleted by admin ${req.user.email}`);

        sendSuccess(res, null, 'Wastage deleted successfully');
    } catch (error) {
        logger.error('Delete wastage error:', error);
        next(error);
    }
};

module.exports = {
    getAllWastages,
    createWastage,
    updateWastage,
    deleteWastage
};
