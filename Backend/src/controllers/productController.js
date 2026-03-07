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
const { fetchMetalPrices, getMetalPriceForProduct, getGSTPercentage } = require('../utils/metalPriceHelper');

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

        // Multi-filter support
        const categories = req.query.categories ? (Array.isArray(req.query.categories) ? req.query.categories : [req.query.categories]) : [];
        const metals = req.query.metals ? (Array.isArray(req.query.metals) ? req.query.metals : [req.query.metals]) : [];
        const purities = req.query.purities ? (Array.isArray(req.query.purities) ? req.query.purities : [req.query.purities]) : [];
        const availability = req.query.availability;
        const search = req.query.search;

        // Weight ranges
        let weightRanges = [];
        if (req.query.weightRanges) {
            try {
                weightRanges = JSON.parse(req.query.weightRanges);
            } catch (e) {
                weightRanges = Array.isArray(req.query.weightRanges) ? req.query.weightRanges : [req.query.weightRanges];
            }
        }

        const { limit: queryLimit, offset } = getPagination(page, limit);

        // Build query with JOIN to wastage table
        let sql = `SELECT p.*, w.jewel_type, w.wastage 
                   FROM products p 
                   LEFT JOIN wastage w ON p.waste_id = w.waste_id 
                   WHERE 1=1`;
        const params = [];

        // Apply Search
        if (search) {
            sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        // Apply Categories (from wastage table jewel_type)
        if (categories.length > 0) {
            const placeholders = categories.map(() => '?').join(',');
            sql += ` AND w.jewel_type IN (${placeholders})`;
            params.push(...categories);
        }

        // Apply Metals
        if (metals.length > 0) {
            const placeholders = metals.map(() => '?').join(',');
            sql += ` AND p.metal IN (${placeholders})`;
            params.push(...metals);
        }

        // Apply Purities
        if (purities.length > 0) {
            const placeholders = purities.map(() => '?').join(',');
            sql += ` AND p.metal_purity IN (${placeholders})`;
            params.push(...purities);
        }

        // Apply Weight Ranges
        if (weightRanges.length > 0) {
            sql += ' AND (';
            const rangeConditions = weightRanges.map(range => {
                if (typeof range === 'string' && range.includes('-')) {
                    const [min, max] = range.split('-').map(Number);
                    params.push(min, max);
                    return `CAST(p.weight AS DECIMAL(10,2)) BETWEEN ? AND ?`;
                } else if (range.min !== undefined && range.max !== undefined) {
                    params.push(range.min, range.max);
                    return `CAST(p.weight AS DECIMAL(10,2)) BETWEEN ? AND ?`;
                }
                return '1=0';
            });
            sql += rangeConditions.join(' OR ') + ')';
        }

        // Apply availability filter
        if (availability && availability.toUpperCase() !== 'ALL') {
            sql += ' AND p.availability = ?';
            params.push(availability);
        }

        // For Count Query
        let countSql = `SELECT COUNT(*) as total 
                        FROM products p 
                        LEFT JOIN wastage w ON p.waste_id = w.waste_id 
                        WHERE 1=1`;
        const countParams = [...params]; // Copy params before adding limit/offset
        countSql += sql.split('WHERE 1=1')[1].split('ORDER BY')[0];

        sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(queryLimit, offset);

        // Get products
        const products = await query(sql, params);

        // Get total count
        const countResult = await query(countSql, countParams);
        const total = countResult[0].total;

        // Fetch metal prices from database
        const metalPriceMap = await fetchMetalPrices();
        const gstPercentage = getGSTPercentage();

        // Parse images and add price calculation
        const productsWithImagesAndPrice = products.map(product => {
            const productWithImages = {
                ...product,
                images: parseImages(product.image)
            };
            const metalRate = getMetalPriceForProduct(productWithImages, metalPriceMap);
            return addPriceToProduct(productWithImages, metalRate, gstPercentage);
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
            `SELECT p.*, w.jewel_type, w.wastage 
             FROM products p 
             LEFT JOIN wastage w ON p.waste_id = w.waste_id 
             WHERE p.id = ?`,
            [productId]
        );

        if (products.length === 0) {
            return next(new AppError('Product not found', 404));
        }

        // Fetch metal prices from database
        const metalPriceMap = await fetchMetalPrices();
        const gstPercentage = getGSTPercentage();

        // Parse images and add price calculation to product
        const productWithImages = {
            ...products[0],
            images: parseImages(products[0].image)
        };
        // Get metal price for this specific product
        const metalRate = getMetalPriceForProduct(productWithImages, metalPriceMap);
        const productWithPrice = addPriceToProduct(productWithImages, metalRate, gstPercentage);

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
            waste_id,
            metal,
            metal_purity,
            weight,
            description,
            availability
        } = req.body;

        // Validation
        if (!name || !waste_id || !metal || !weight) {
            return next(new AppError('Product name, wastage type, metal, and weight are required', 400));
        }

        if (isNaN(parseFloat(weight)) || parseFloat(weight) <= 0) {
            return next(new AppError('Please provide a valid weight', 400));
        }
        // Get uploaded image filenames (multiple files)
        const images = req.files ? req.files.map(file => file.filename) : [];
        const imageJson = JSON.stringify(images);

        // Insert product (store actual values or NULL, never 'All')
        const result = await query(
            `INSERT INTO products
            (name, waste_id, metal, metal_purity, weight, description, availability, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                waste_id,
                metal || null,
                metal_purity || null,
                weight || null,
                description || null,
                (availability && ['YES', 'NO'].includes(availability)) ? availability : 'YES',
                imageJson
            ]
        );

        // Get created product with wastage data
        const products = await query(
            `SELECT p.*, w.jewel_type, w.wastage 
             FROM products p 
             LEFT JOIN wastage w ON p.waste_id = w.waste_id 
             WHERE p.id = ?`,
            [result.insertId]
        );

        logger.info(`Product created: ${name} by admin ${req.user.email}`);

        // Fetch metal prices from database
        const metalPriceMap = await fetchMetalPrices();
        const gstPercentage = getGSTPercentage();

        // Get metal price for this specific product
        const metalRate = getMetalPriceForProduct(products[0], metalPriceMap);
        const productWithPrice = addPriceToProduct(products[0], metalRate, gstPercentage);

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
            waste_id,
            metal,
            metal_purity,
            weight,
            description,
            availability,
            top_selling,
            featured
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
        if (waste_id !== undefined) {
            updates.push('waste_id = ?');
            params.push(waste_id);
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
            // Only update if valid value 'YES' or 'NO'
            if (['YES', 'NO'].includes(availability)) {
                updates.push('availability = ?');
                params.push(availability);
            }
        }
        if (top_selling !== undefined) {
            updates.push('top_selling = ?');
            params.push(top_selling ? 1 : 0);
        }
        if (featured !== undefined) {
            updates.push('featured = ?');
            params.push(featured ? 1 : 0);
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

        // Get updated product with wastage data
        const products = await query(
            `SELECT p.*, w.jewel_type, w.wastage 
             FROM products p 
             LEFT JOIN wastage w ON p.waste_id = w.waste_id 
             WHERE p.id = ?`,
            [productId]
        );

        logger.info(`Product ${productId} updated by admin ${req.user.email}`);

        // Fetch metal prices from database
        const metalPriceMap = await fetchMetalPrices();
        const gstPercentage = getGSTPercentage();

        // Get metal price for this specific product
        const metalRate = getMetalPriceForProduct(products[0], metalPriceMap);
        const productWithPrice = addPriceToProduct(products[0], metalRate, gstPercentage);

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
 * @desc    Get dynamic filter options
 * @access  Public
 */
const getFilterOptions = async (req, res, next) => {
    try {
        const categories = await query('SELECT DISTINCT jewel_type FROM wastage ORDER BY jewel_type');
        const metals = await query('SELECT DISTINCT metal FROM products WHERE metal IS NOT NULL AND metal != "" ORDER BY metal');
        const purities = await query('SELECT DISTINCT metal_purity FROM products WHERE metal_purity IS NOT NULL AND metal_purity != "" ORDER BY metal_purity');

        sendSuccess(res, {
            categories: categories.map(c => c.jewel_type),
            metals: metals.map(m => m.metal),
            purities: purities.map(p => p.metal_purity)
        }, 'Filter options retrieved successfully');
    } catch (error) {
        logger.error('Get filter options error:', error);
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
            'SELECT DISTINCT jewel_type FROM wastage ORDER BY jewel_type'
        );

        const categoryList = categories.map(c => c.jewel_type);

        sendSuccess(res, { categories: categoryList }, 'Categories retrieved successfully');
    } catch (error) {
        logger.error('Get categories error:', error);
        next(error);
    }
};

/**
 * @desc    Get top selling products
 * @route   GET /api/products/top-selling
 * @access  Public
 */
const getTopSellingProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { limit: queryLimit, offset } = getPagination(page, limit);

        const sql = `SELECT p.*, w.jewel_type, w.wastage 
                     FROM products p 
                     LEFT JOIN wastage w ON p.waste_id = w.waste_id 
                     WHERE p.top_selling = 1 AND p.availability = "YES" 
                     ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
        const products = await query(sql, [queryLimit, offset]);

        const countResult = await query('SELECT COUNT(*) as total FROM products WHERE top_selling = 1 AND availability = "YES"');
        const total = countResult[0].total;

        // Fetch metal prices from database
        const metalPriceMap = await fetchMetalPrices();
        const gstPercentage = getGSTPercentage();

        const productsWithImagesAndPrice = products.map(product => {
            const productWithImages = {
                ...product,
                images: parseImages(product.image)
            };
            // Get metal price for this specific product
            const metalRate = getMetalPriceForProduct(productWithImages, metalPriceMap);
            return addPriceToProduct(productWithImages, metalRate, gstPercentage);
        });

        const response = formatPaginatedResponse(productsWithImagesAndPrice, page, limit, total);

        sendSuccess(res, response, 'Top selling products retrieved successfully');
    } catch (error) {
        logger.error('Get top selling products error:', error);
        next(error);
    }
};

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
const getFeaturedProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { limit: queryLimit, offset } = getPagination(page, limit);

        const sql = `SELECT p.*, w.jewel_type, w.wastage 
                     FROM products p 
                     LEFT JOIN wastage w ON p.waste_id = w.waste_id 
                     WHERE p.featured = 1 AND p.availability = "YES" 
                     ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
        const products = await query(sql, [queryLimit, offset]);

        const countResult = await query('SELECT COUNT(*) as total FROM products WHERE featured = 1 AND availability = "YES"');
        const total = countResult[0].total;

        // Fetch metal prices from database
        const metalPriceMap = await fetchMetalPrices();
        const gstPercentage = getGSTPercentage();

        const productsWithImagesAndPrice = products.map(product => {
            const productWithImages = {
                ...product,
                images: parseImages(product.image)
            };
            // Get metal price for this specific product
            const metalRate = getMetalPriceForProduct(productWithImages, metalPriceMap);
            return addPriceToProduct(productWithImages, metalRate, gstPercentage);
        });

        const response = formatPaginatedResponse(productsWithImagesAndPrice, page, limit, total);

        sendSuccess(res, response, 'Featured products retrieved successfully');
    } catch (error) {
        logger.error('Get featured products error:', error);
        next(error);
    }
};

/**
 * @desc    Get user's cart products
 * @route   GET /api/products/user/cart
 * @access  Private (Authenticated users)
 */
const getUserCartProducts = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new AppError('Unauthorized', 401));
        }

        const users = await query(
            'SELECT add_to_cart FROM users WHERE id = ?',
            [userId]
        );

        if (!users.length) {
            return next(new AppError('User not found', 404));
        }

        let cartItems = [];

        // Parse cart JSON
        try {
            const parsed = JSON.parse(users[0].add_to_cart || '[]');

            if (Array.isArray(parsed)) {
                cartItems = parsed;
            }
        } catch (err) {
            logger.error('Invalid cart JSON', err);
        }

        // Extract product IDs correctly
        const cartProductIds = cartItems
            .map(item => Number(item.productId))
            .filter(id => Number.isInteger(id) && id > 0);

        if (cartProductIds.length === 0) {
            return sendSuccess(
                res,
                { products: [], count: 0 },
                'Cart is empty'
            );
        }

        // Build placeholders
        const placeholders = cartProductIds.map(() => '?').join(',');

        const products = await query(
            `SELECT p.*, w.jewel_type, w.wastage 
             FROM products p 
             LEFT JOIN wastage w ON p.waste_id = w.waste_id 
             WHERE p.id IN (${placeholders})`,
            cartProductIds
        );

        // Fetch metal prices from database
        const metalPriceMap = await fetchMetalPrices();
        const gstPercentage = getGSTPercentage();

        // Match stored cart items with fetched product data
        const productsWithDetails = cartItems.map(item => {
            const product = products.find(p => String(p.id) === String(item.productId));
            if (!product) return null;

            const productWithImages = {
                ...product,
                images: parseImages(product.image)
            };

            const metalRate = getMetalPriceForProduct(productWithImages, metalPriceMap);
            const productWithPrice = addPriceToProduct(productWithImages, metalRate, gstPercentage);

            return {
                ...productWithPrice,
                variantId: item.variantId,
                quantity: item.quantity || 1
            };
        }).filter(item => item !== null);

        return sendSuccess(
            res,
            {
                products: productsWithDetails,
                count: productsWithDetails.reduce((acc, item) => acc + (item.quantity || 0), 0)
            },
            'Cart products retrieved successfully'
        );

    } catch (error) {
        logger.error('Get user cart products error:', error);
        next(error);
    }
};

/**
 * @desc    Get user's wishlist products
 * @route   GET /api/products/user/wishlist
 * @access  Private (Authenticated users)
 */
const getUserWishlistProducts = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get user's wishlist data
        const users = await query(
            'SELECT wishlist FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return next(new AppError('User not found', 404));
        }

        const user = users[0];
        let wishlistProductIds = [];

        // Parse wishlist data (stored as JSON string)
        if (user.wishlist) {
            try {
                wishlistProductIds = JSON.parse(user.wishlist);
                if (!Array.isArray(wishlistProductIds)) {
                    wishlistProductIds = [];
                }
            } catch (e) {
                logger.error('Error parsing wishlist data:', e);
                wishlistProductIds = [];
            }
        }

        // If wishlist is empty, return empty array
        if (wishlistProductIds.length === 0) {
            return sendSuccess(res, { products: [], count: 0 }, 'Wishlist is empty');
        }

        // Get products from wishlist
        const placeholders = wishlistProductIds.map(() => '?').join(',');
        const products = await query(
            `SELECT p.*, w.jewel_type, w.wastage 
             FROM products p 
             LEFT JOIN wastage w ON p.waste_id = w.waste_id 
             WHERE p.id IN (${placeholders})`,
            wishlistProductIds
        );

        // Fetch metal prices from database
        const metalPriceMap = await fetchMetalPrices();
        const gstPercentage = getGSTPercentage();

        // Parse images and add price calculation to all products
        const productsWithImagesAndPrice = products.map(product => {
            const productWithImages = {
                ...product,
                images: parseImages(product.image)
            };
            // Get metal price for this specific product
            const metalRate = getMetalPriceForProduct(productWithImages, metalPriceMap);
            return addPriceToProduct(productWithImages, metalRate, gstPercentage);
        });

        sendSuccess(
            res,
            { products: productsWithImagesAndPrice, count: productsWithImagesAndPrice.length },
            'Wishlist products retrieved successfully'
        );
    } catch (error) {
        logger.error('Get user wishlist products error:', error);
        next(error);
    }
};

module.exports = {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getFilterOptions,
    getCategories,
    getTopSellingProducts,
    getFeaturedProducts,
    getUserCartProducts,
    getUserWishlistProducts
};

