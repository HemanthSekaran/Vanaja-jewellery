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

/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
const getAllProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;
        const availability = req.query.availability;

        const { limit: queryLimit, offset } = getPagination(page, limit);

        // Build query
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }

        if (availability) {
            sql += ' AND availability = ?';
            params.push(availability);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(queryLimit, offset);

        // Get products
        const products = await query(sql, params);

        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
        const countParams = [];

        if (category) {
            countSql += ' AND category = ?';
            countParams.push(category);
        }

        if (availability) {
            countSql += ' AND availability = ?';
            countParams.push(availability);
        }

        const countResult = await query(countSql, countParams);
        const total = countResult[0].total;

        const response = formatPaginatedResponse(products, page, limit, total);

        sendSuccess(res, response, 'Products retrieved successfully');
    } catch (error) {
        logger.error('Get all products error:', error);
        next(error);
    }
};

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 * @access  Public
 */
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

        sendSuccess(res, { product: products[0] }, 'Product retrieved successfully');
    } catch (error) {
        logger.error('Get product error:', error);
        next(error);
    }
};

/**
 * @desc    Create product
 * @route   POST /api/products
 * @access  Private (Admin)
 */
const createProduct = async (req, res, next) => {
    try {
        const { name, grams, wastage, category, description, availability } = req.body;

        // Get uploaded image filename
        const image = req.file ? req.file.filename : null;

        // Insert product
        const result = await query(
            `INSERT INTO products 
            (name, grams, wastage, category, description, availability, image) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, grams, wastage, category, description || null, availability || 'YES', image]
        );

        // Get created product
        const products = await query(
            'SELECT * FROM products WHERE id = ?',
            [result.insertId]
        );

        logger.info(`Product created: ${name} by admin ${req.user.email}`);

        sendSuccess(
            res,
            { product: products[0] },
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
        const { name, grams, wastage, category, description, availability } = req.body;

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
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        if (availability !== undefined) {
            updates.push('availability = ?');
            params.push(availability);
        }

        // Handle image update
        if (req.file) {
            updates.push('image = ?');
            params.push(req.file.filename);

            // Delete old image if exists
            if (existingProduct.image) {
                const oldImagePath = path.join('./uploads/products', existingProduct.image);
                deleteFile(oldImagePath);
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

        sendSuccess(res, { product: products[0] }, 'Product updated successfully');
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

        // Delete product image if exists
        if (product.image) {
            const imagePath = path.join('./uploads/products', product.image);
            deleteFile(imagePath);
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
