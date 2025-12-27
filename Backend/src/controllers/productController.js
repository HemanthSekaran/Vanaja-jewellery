/**
 * Product Controller
 * Handles CRUD operations for products
 */

const { query } = require('../config/database');
const { sendSuccess, getPagination, formatPaginatedResponse } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const { deleteFile } = require('../middleware/upload');
const logger = require('../utils/logger');
const path = require('path');
const { addPriceToProducts, addPriceToProduct } = require('../utils/priceCalculator');

/**
 * Helper function to parse images from JSON string
 * @param {string} imageData - JSON string or single image filename
 * @returns {Array} Array of image filenames
 */
const parseImages = (imageData) => {
    if (!imageData) return [];

    try {
        const parsed = JSON.parse(imageData);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
        // If not JSON, treat as single image (backward compatibility)
        return [imageData];
    }
};

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
const getAllProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filterType = req.query.filterType;
        const filterValue = req.query.filterValue;
        const availability = req.query.availability;

        const { limit: queryLimit, offset } = getPagination(page, limit);

        // Map filterType to actual database column names
        const columnMapping = {
            'category': 'category',
            'metal': 'metal',
            'metalPurity': 'metal_purity',
            'weight': 'weight'
        };

        // Build query
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        // Apply filter only if filterType, filterValue exist and filterValue is not 'All'
        if (filterType && filterValue && filterValue.toUpperCase() !== 'ALL') {
            const columnName = columnMapping[filterType];
            if (columnName) {
                // Special handling for weight range (e.g., "0-2" means between 0 and 2)
                if (filterType === 'weight' && filterValue.includes('-')) {
                    const [minWeight, maxWeight] = filterValue.split('-').map(v => parseFloat(v.trim()));
                    if (!isNaN(minWeight) && !isNaN(maxWeight)) {
                        sql += ` AND CAST(${columnName} AS DECIMAL(10,2)) BETWEEN ? AND ?`;
                        params.push(minWeight, maxWeight);
                    }
                } else {
                    // Exact match for other filters
                    sql += ` AND ${columnName} = ?`;
                    params.push(filterValue);
                }
            }
        }

        // Apply availability filter if provided and not 'All'
        if (availability && availability.toUpperCase() !== 'ALL') {
            sql += ' AND availability = ?';
            params.push(availability);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(queryLimit, offset);

        // Get products
        const products = await query(sql, params);

        // Get total count with same filters
        let countSql = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
        const countParams = [];

        // Apply same filters for count
        if (filterType && filterValue && filterValue.toUpperCase() !== 'ALL') {
            const columnName = columnMapping[filterType];
            if (columnName) {
                // Special handling for weight range
                if (filterType === 'weight' && filterValue.includes('-')) {
                    const [minWeight, maxWeight] = filterValue.split('-').map(v => parseFloat(v.trim()));
                    if (!isNaN(minWeight) && !isNaN(maxWeight)) {
                        countSql += ` AND CAST(${columnName} AS DECIMAL(10,2)) BETWEEN ? AND ?`;
                        countParams.push(minWeight, maxWeight);
                    }
                } else {
                    // Exact match for other filters
                    countSql += ` AND ${columnName} = ?`;
                    countParams.push(filterValue);
                }
            }
        }

        if (availability && availability.toUpperCase() !== 'ALL') {
            countSql += ' AND availability = ?';
            countParams.push(availability);
        }

        const countResult = await query(countSql, countParams);
        const total = countResult[0].total;

        // Get pricing configuration from environment variables
        const goldRatePerGram = parseFloat(process.env.GOLD_RATE_PER_GRAM) || 12000;
        const gstPercentage = parseFloat(process.env.GST_PERCENTAGE) || 3;

        // Parse images and add price calculation to all products
        const productsWithImagesAndPrice = products.map(product => {
            const productWithImages = {
                ...product,
                images: parseImages(product.image)
            };
            return addPriceToProduct(productWithImages, goldRatePerGram, gstPercentage);
        });

        const response = formatPaginatedResponse(productsWithImagesAndPrice, page, limit, total);

        sendSuccess(res, response, 'Products retrieved successfully');
    } catch (error) {
        logger.error('Get all products error:', error);
        next(error);
    }
};

const getProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;

        const products = await query(
            'SELECT * FROM products WHERE id = ?',
            [productId]
        );

        if (products.length === 0) {
            return next(new AppError('Product not found', 404));
        }

        // Get pricing configuration from environment variables
        const goldRatePerGram = parseFloat(process.env.GOLD_RATE_PER_GRAM) || 12000;
        const gstPercentage = parseFloat(process.env.GST_PERCENTAGE) || 3;

        // Parse images and add price calculation to product
        const productWithImages = {
            ...products[0],
            images: parseImages(products[0].image)
        };
        const productWithPrice = addPriceToProduct(productWithImages, goldRatePerGram, gstPercentage);

        sendSuccess(res, { product: productWithPrice }, 'Product retrieved successfully');
    } catch (error) {
        logger.error('Get product error:', error);
        next(error);
    }
};

const createProduct = async (req, res, next) => {
    try {
        const {
            name,
            wastage,
            category,
            metal,
            metal_purity,
            weight,
            description,
            availability
        } = req.body;
        // Get uploaded image filenames (multiple files)
        const images = req.files ? req.files.map(file => file.filename) : [];
        const imageJson = JSON.stringify(images);

        // Insert product (store actual values or NULL, never 'All')
        const result = await query(
            `INSERT INTO products
            (name, wastage, category, metal, metal_purity, weight, description, availability, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                wastage,
                category,
                metal || null,
                metal_purity || null,
                weight || null,
                description || null,
                availability || 'YES',
                imageJson
            ]
        );

        // Get created product
        const products = await query(
            'SELECT * FROM products WHERE id = ?',
            [result.insertId]
        );

        logger.info(`Product created: ${name} by admin ${req.user.email}`);

        // Get pricing configuration from environment variables
        const goldRatePerGram = parseFloat(process.env.GOLD_RATE_PER_GRAM) || 12000;
        const gstPercentage = parseFloat(process.env.GST_PERCENTAGE) || 3;

        // Add price calculation to product
        const productWithPrice = addPriceToProduct(products[0], goldRatePerGram, gstPercentage);

        sendSuccess(
            res,
            { product: productWithPrice },
            'Product created successfully',
            201
        );
    } catch (error) {
        logger.error('Create product error:', error);
        next(error);
    }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private (Admin)
 */
const updateProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const {
            name,
            grams,
            wastage,
            category,
            metal,
            metal_purity,
            weight,
            description,
            availability
        } = req.body;

        // Check if product exists
        const existingProducts = await query(
            'SELECT * FROM products WHERE id = ?',
            [productId]
        );

        if (existingProducts.length === 0) {
            return next(new AppError('Product not found', 404));
        }

        const existingProduct = existingProducts[0];

        // Build update query dynamically
        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (grams !== undefined) {
            updates.push('grams = ?');
            params.push(grams);
        }
        if (wastage !== undefined) {
            updates.push('wastage = ?');
            params.push(wastage);
        }
        if (category !== undefined) {
            updates.push('category = ?');
            params.push(category);
        }
        if (metal !== undefined) {
            updates.push('metal = ?');
            params.push(metal);
        }
        if (metal_purity !== undefined) {
            updates.push('metal_purity = ?');
            params.push(metal_purity);
        }
        if (weight !== undefined) {
            updates.push('weight = ?');
            params.push(weight);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        if (availability !== undefined) {
            updates.push('availability = ?');
            params.push(availability);
        }

        // Handle image update
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.filename);
            updates.push('image = ?');
            params.push(JSON.stringify(newImages));

            // Delete old images if they exist
            if (existingProduct.image) {
                try {
                    const oldImages = JSON.parse(existingProduct.image);
                    if (Array.isArray(oldImages)) {
                        oldImages.forEach(img => {
                            const oldImagePath = path.join('./uploads/products', img);
                            deleteFile(oldImagePath);
                        });
                    }
                } catch (e) {
                    // If not JSON, treat as single image (backward compatibility)
                    const oldImagePath = path.join('./uploads/products', existingProduct.image);
                    deleteFile(oldImagePath);
                }
            }
        }

        if (updates.length === 0) {
            return next(new AppError('No fields to update', 400));
        }

        params.push(productId);

        await query(
            `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Get updated product
        const products = await query(
            'SELECT * FROM products WHERE id = ?',
            [productId]
        );

        logger.info(`Product ${productId} updated by admin ${req.user.email}`);

        // Get pricing configuration from environment variables
        const goldRatePerGram = parseFloat(process.env.GOLD_RATE_PER_GRAM) || 12000;
        const gstPercentage = parseFloat(process.env.GST_PERCENTAGE) || 3;

        // Add price calculation to product
        const productWithPrice = addPriceToProduct(products[0], goldRatePerGram, gstPercentage);

        sendSuccess(res, { product: productWithPrice }, 'Product updated successfully');
    } catch (error) {
        logger.error('Update product error:', error);
        next(error);
    }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin)
 */
const deleteProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;

        // Check if product exists
        const products = await query(
            'SELECT * FROM products WHERE id = ?',
            [productId]
        );

        if (products.length === 0) {
            return next(new AppError('Product not found', 404));
        }

        const product = products[0];

        // Delete product images if they exist
        if (product.image) {
            const images = parseImages(product.image);
            images.forEach(img => {
                const imagePath = path.join('./uploads/products', img);
                deleteFile(imagePath);
            });
        }

        // Delete product from database
        await query('DELETE FROM products WHERE id = ?', [productId]);

        logger.info(`Product ${productId} deleted by admin ${req.user.email}`);

        sendSuccess(res, null, 'Product deleted successfully');
    } catch (error) {
        logger.error('Delete product error:', error);
        next(error);
    }
};

/**
 * @desc    Get product categories
 * @route   GET /api/products/categories/list
 * @access  Public
 */
const getCategories = async (req, res, next) => {
    try {
        const categories = await query(
            'SELECT DISTINCT category FROM products ORDER BY category'
        );

        const categoryList = categories.map(c => c.category);

        sendSuccess(res, { categories: categoryList }, 'Categories retrieved successfully');
    } catch (error) {
        logger.error('Get categories error:', error);
        next(error);
    }
};

module.exports = {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories
};
