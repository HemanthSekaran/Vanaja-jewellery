/**
 * Price Calculator Utility
 * Calculates product prices based on weight, wastage, gold rate, and GST
 */

/**
 * Calculate product price with wastage and GST
 * @param {number} jewelWeight - Weight of the jewel in grams (from weight column)
 * @param {number} wastagePercentage - Wastage percentage (from wastage column)
 * @param {number} metalRatePerGram - Metal rate per gram (fetched from metal_prices table)
 * @param {number} gstPercentage - GST percentage (default: 3)
 * @returns {Object} Price breakdown
 */
const calculatePrice = (jewelWeight, wastagePercentage, metalRatePerGram = 7000, gstPercentage = 3) => {
    // Validate inputs
    if (!jewelWeight || jewelWeight <= 0) {
        return null;
    }

    // Convert to numbers and handle edge cases
    const weight = parseFloat(jewelWeight);
    const wastage = parseInt(wastagePercentage) || 0;
    const metalRate = parseFloat(metalRatePerGram) || 7000;
    const gstRate = parseFloat(gstPercentage) || 3;

    // Calculate wastage weight
    const wastageWeight = (weight * wastage) / 100;

    // Calculate total weight
    const totalWeight = weight + wastageWeight;

    // Calculate metal value (jewel weight * metal rate per gram, before wastage)
    const metalValue = weight * metalRate;

    // Calculate base price (before GST)
    const basePrice = totalWeight * metalRate;

    // Calculate GST amount
    const gstAmount = (basePrice * gstRate) / 100;

    // Calculate final price (including GST)
    const finalPrice = basePrice + gstAmount;

    return {
        jewelWeight: parseFloat(weight.toFixed(3)),
        wastagePercentage: wastage,
        wastageWeight: parseFloat(wastageWeight.toFixed(3)),
        totalWeight: parseFloat(totalWeight.toFixed(3)),
        metalRatePerGram: metalRate,
        metalValue: parseFloat(metalValue.toFixed(2)),
        basePrice: parseFloat(basePrice.toFixed(2)),
        gstPercentage: gstRate,
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        finalPrice: parseFloat(finalPrice.toFixed(2))
    };
};

/**
 * Add price calculation to product object
 * @param {Object} product - Product object from database
 * @param {number} metalRatePerGram - Metal rate per gram (from metal_prices table)
 * @param {number} gstPercentage - GST percentage
 * @returns {Object} Product with price calculation
 */
const addPriceToProduct = (product, metalRatePerGram, gstPercentage) => {
    if (!product) {
        return product;
    }

    // Calculate price if weight and wastage are available
    const priceCalculation = calculatePrice(
        product.weight,
        product.wastage,
        metalRatePerGram,
        gstPercentage
    );

    // Return product with price calculation
    return {
        ...product,
        priceCalculation: priceCalculation || null
    };
};

/**
 * Add price calculation to array of products
 * @param {Array} products - Array of product objects
 * @param {number} metalRatePerGram - Metal rate per gram (from metal_prices table)
 * @param {number} gstPercentage - GST percentage
 * @returns {Array} Products with price calculations
 */
const addPriceToProducts = (products, metalRatePerGram, gstPercentage) => {
    if (!Array.isArray(products)) {
        return products;
    }

    return products.map(product => addPriceToProduct(product, metalRatePerGram, gstPercentage));
};

module.exports = {
    calculatePrice,
    addPriceToProduct,
    addPriceToProducts
};
