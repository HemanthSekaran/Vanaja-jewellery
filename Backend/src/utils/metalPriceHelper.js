/**
 * Metal Price Helper Utility
 * Handles fetching and mapping metal prices from database
 */

const { query } = require('../config/database');
const logger = require('./logger');

/**
 * Fetch all metal prices from database
 * @returns {Promise<Object>} Object with metal_name as key and price as value
 */
const fetchMetalPrices = async () => {
    try {
        const metalPrices = await query('SELECT metal_name, price FROM metal_prices');

        // Convert array to object for easy lookup
        const priceMap = {};
        metalPrices.forEach(item => {
            priceMap[item.metal_name.toLowerCase()] = parseFloat(item.price);
        });

        return priceMap;
    } catch (error) {
        logger.error('Error fetching metal prices:', error);
        // Return default fallback if database query fails
        return { 'default': 7000.00 };
    }
};

/**
 * Construct metal name from product's metal and metal_purity fields
 * @param {string} metal - Metal type (e.g., "gold", "silver")
 * @param {string} metalPurity - Metal purity (e.g., "22k", "18k", "925")
 * @returns {string} Composite metal name (e.g., "gold-22k")
 */
const constructMetalName = (metal, metalPurity) => {
    if (!metal || !metalPurity) {
        return 'default';
    }

    // Normalize and construct composite name
    const normalizedMetal = metal.toString().toLowerCase().trim();
    const normalizedPurity = metalPurity.toString().toLowerCase().trim();

    return `${normalizedMetal}-${normalizedPurity}`;
};

/**
 * Get metal price for a specific product
 * @param {Object} product - Product object with metal and metal_purity fields
 * @param {Object} priceMap - Metal price map from fetchMetalPrices()
 * @returns {number} Price per gram for the metal
 */
const getMetalPriceForProduct = (product, priceMap) => {
    if (!product) {
        return priceMap['default'] || 7000.00;
    }

    // Construct metal name from product fields
    const metalName = constructMetalName(product.metal, product.metal_purity);

    // Look up price in the map
    const price = priceMap[metalName.toLowerCase()];

    // If not found, use default
    if (price === undefined || price === null) {
        logger.warn(`Metal price not found for '${metalName}', using default`);
        return priceMap['default'] || 7000.00;
    }

    return price;
};

/**
 * Get GST percentage from environment or use default
 * @returns {number} GST percentage
 */
const getGSTPercentage = () => {
    return parseFloat(process.env.GST_PERCENTAGE) || 3;
};

module.exports = {
    fetchMetalPrices,
    constructMetalName,
    getMetalPriceForProduct,
    getGSTPercentage
};
