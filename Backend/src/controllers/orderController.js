/**
 * Order Controller
 * Handles checkout and order operations using the standalone order_items table.
 * Each product selected by the user creates one row in order_items with its
 * own unique order_id (auto-increment integer).
 */

const { query } = require('../config/database');
const { sendSuccess } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const { calculatePrice } = require('../utils/priceCalculator');
const { getMetalPriceForProduct, getGSTPercentage } = require('../utils/metalPriceHelper');

/**
 * @desc    Create order (Checkout)
 *          Each product in productIds becomes a separate row in order_items.
 * @route   POST /api/orders/checkout
 * @access  Private (Authenticated users)
 */
const createOrder = async (req, res, next) => {
    let connection;

    try {
        const { productIds } = req.body;
        const userId = req.user.id;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return next(new AppError('Please provide an array of product IDs', 400));
        }

        const { getConnection } = require('../config/database');
        connection = await getConnection();
        await connection.beginTransaction();

        try {
            // Pre-fetch shared pricing data once
            const gstPercentage = await getGSTPercentage();
            const { fetchMetalPrices } = require('../utils/metalPriceHelper');
            const metalPriceMap = await fetchMetalPrices();

            const createdOrderIds = [];

            for (const productId of productIds) {
                // Fetch product with wastage info
                const [products] = await connection.query(
                    `SELECT p.*, w.wastage
                     FROM products p
                     LEFT JOIN wastage w ON p.waste_id = w.waste_id
                     WHERE p.id = ?`,
                    [productId]
                );

                if (products.length === 0) {
                    throw new AppError(`Product with ID ${productId} not found`, 404);
                }

                const product = products[0];

                if (product.availability !== 'YES') {
                    throw new AppError(`Product "${product.name}" is not available`, 400);
                }

                if (!product.weight || product.weight <= 0) {
                    throw new AppError(`Product "${product.name}" does not have valid weight information`, 400);
                }

                // Calculate price for this product
                const metalRatePerGram = getMetalPriceForProduct(product, metalPriceMap);
                const priceCalc = calculatePrice(
                    product.weight,
                    product.wastage || 0,
                    metalRatePerGram,
                    gstPercentage
                );

                if (!priceCalc) {
                    throw new AppError(`Unable to calculate price for product "${product.name}"`, 500);
                }

                // Insert one row per product
                const [result] = await connection.query(
                    `INSERT INTO order_items (
                        user_id, order_status,
                        product_id, product_name, product_category, metal, metal_purity,
                        weight, wastage_percentage, wastage_weight, total_weight,
                        metal_rate_per_gram, metal_value, wastage_value, base_price,
                        gst_percentage, gst_amount, final_price
                    ) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        product.id,
                        product.name,
                        product.category || null,
                        product.metal || null,
                        product.metal_purity || null,
                        priceCalc.jewelWeight,
                        priceCalc.wastagePercentage,
                        priceCalc.wastageWeight,
                        priceCalc.totalWeight,
                        priceCalc.metalRatePerGram,
                        priceCalc.metalValue,
                        priceCalc.wastageValue,
                        priceCalc.basePrice,
                        priceCalc.gstPercentage,
                        priceCalc.gstAmount,
                        priceCalc.finalPrice
                    ]
                );

                createdOrderIds.push(result.insertId);
            }

            await connection.commit();

            // Fetch and return all newly created order items
            const placeholders = createdOrderIds.map(() => '?').join(', ');
            const [createdItems] = await connection.query(
                `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY order_id ASC`,
                createdOrderIds
            );

            sendSuccess(res, { orders: createdItems }, 'Order placed successfully', 201);

        } catch (error) {
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        next(error);
    } finally {
        if (connection) connection.release();
    }
};

/**
 * @desc    Get all orders for the authenticated user
 * @route   GET /api/orders
 * @access  Private (Authenticated users)
 */
const getAllOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const countResult = await query(
            'SELECT COUNT(*) AS total FROM order_items WHERE user_id = ?',
            [userId]
        );
        const total = countResult[0].total;

        const orders = await query(
            `SELECT * FROM order_items
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        sendSuccess(res, {
            orders,
            pagination: {
                currentPage: page,
                perPage: limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 'Orders retrieved successfully');

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single order item by order_id
 * @route   GET /api/orders/:id
 * @access  Private (User can view own orders, Admin can view any)
 */
const getOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const orders = await query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId]
        );

        if (!orders || orders.length === 0) {
            return next(new AppError('Order not found', 404));
        }

        const order = orders[0];

        if (!isAdmin && order.user_id !== userId) {
            return next(new AppError('Not authorized to view this order', 403));
        }

        sendSuccess(res, { order }, 'Order retrieved successfully');

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all orders (Admin only)
 * @route   GET /api/orders/admin/all
 * @access  Private (Admin only)
 */
const getAllOrdersAdmin = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const countResult = await query(
            'SELECT COUNT(*) AS total FROM order_items'
        );
        const total = countResult[0].total;

        const orders = await query(
            `SELECT oi.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
             FROM order_items oi
             LEFT JOIN users u ON oi.user_id = u.id
             ORDER BY oi.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        sendSuccess(res, {
            orders,
            pagination: {
                currentPage: page,
                perPage: limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 'All orders retrieved successfully');

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update order status by order_id (Admin only)
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin only)
 */
const updateOrderStatus = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        const orders = await query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId]
        );

        if (!orders || orders.length === 0) {
            return next(new AppError('Order not found', 404));
        }

        await query(
            'UPDATE order_items SET order_status = ? WHERE order_id = ?',
            [status, orderId]
        );

        const updatedOrders = await query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId]
        );

        sendSuccess(res, {
            order: updatedOrders[0]
        }, 'Order status updated successfully');

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    getAllOrdersAdmin,
    updateOrderStatus
};
