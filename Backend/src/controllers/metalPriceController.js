/**
 * Metal Price Controller
 * Handles operations for metal prices (gold, silver, etc.)
 */

const { query } = require('../config/database');
const { sendSuccess } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * @desc    Get all metal prices
 * @route   GET /api/metal-prices
 * @access  Public
 */
const getAllMetalPrices = async (req, res, next) => {
    try {
        const sql = `
            SELECT s_no, metal_name, price, created_at, updated_at
            FROM metal_prices
            ORDER BY metal_name ASC
        `;

        const metalPrices = await query(sql);

        return sendSuccess(res, 'Metal prices retrieved successfully', {
            metalPrices,
            count: metalPrices.length
        });
    } catch (error) {
        logger.error('Error fetching metal prices:', error);
        next(new AppError('Failed to retrieve metal prices', 500));
    }
};

/**
 * @desc    Update metal price
 * @route   PUT /api/metal-prices/:metalName
 * @access  Private (Admin only)
 */
const updateMetalPrice = async (req, res, next) => {
    try {
        const { metalName } = req.params;
        const { price } = req.body;

        // Check if metal exists
        const checkSql = 'SELECT * FROM metal_prices WHERE metal_name = ?';
        const existingMetal = await query(checkSql, [metalName]);

        if (existingMetal.length === 0) {
            return next(new AppError(`Metal '${metalName}' not found`, 404));
        }

        // Update the price
        const updateSql = `
            UPDATE metal_prices 
            SET price = ? 
            WHERE metal_name = ?
        `;

        await query(updateSql, [price, metalName]);

        // Fetch updated record
        const updatedMetal = await query(checkSql, [metalName]);

        logger.info(`Metal price updated: ${metalName} = ${price}`);

        return sendSuccess(res, 'Metal price updated successfully', {
            metalPrice: updatedMetal[0]
        });
    } catch (error) {
        logger.error('Error updating metal price:', error);
        next(new AppError('Failed to update metal price', 500));
    }
};

module.exports = {
    getAllMetalPrices,
    updateMetalPrice
};
