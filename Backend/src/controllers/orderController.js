/**
 * Order Controller
 * Handles checkout and order retrieval operations
 */

const { query } = require('../config/database');
const { sendSuccess } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const { calculatePrice } = require('../utils/priceCalculator');
const { getMetalPriceForProduct, getGSTPercentage } = require('../utils/metalPriceHelper');

/**
 * @desc    Create order (Checkout)
 * @route   POST /api/orders/checkout
 * @access  Private (Authenticated users)
 */
const createOrder = async (req, res, next) => {
    let connection;

    try {
        const { productIds } = req.body;
        const userId = req.user.id;

        // Validate productIds
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return next(new AppError('Please provide an array of product IDs', 400));
        }

        // Get database connection for transaction
        const { getConnection } = require('../config/database');
        connection = await getConnection();

        // Start transaction
        await connection.beginTransaction();

        try {
            // Initialize order totals
            let totalAmount = 0;
            let totalGst = 0;
            let grandTotal = 0;
            const orderItemsData = [];

            // Fetch GST percentage and metal prices once
            const gstPercentage = await getGSTPercentage();
            const { fetchMetalPrices } = require('../utils/metalPriceHelper');
            const metalPriceMap = await fetchMetalPrices();

            // Process each product
            for (const productId of productIds) {
                // Fetch product details
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

                // Check availability
                if (product.availability !== 'YES') {
                    throw new AppError(`Product "${product.name}" is not available`, 400);
                }

                // Validate weight
                if (!product.weight || product.weight <= 0) {
                    throw new AppError(`Product "${product.name}" does not have valid weight information`, 400);
                }

                // Get metal price for this product
                const metalRatePerGram = getMetalPriceForProduct(product, metalPriceMap);

                // Calculate price breakdown
                const priceCalc = calculatePrice(
                    product.weight,
                    product.wastage || 0,
                    metalRatePerGram,
                    gstPercentage
                );

                if (!priceCalc) {
                    throw new AppError(`Unable to calculate price for product "${product.name}"`, 500);
                }

                // Add to order totals
                totalAmount += priceCalc.basePrice;
                totalGst += priceCalc.gstAmount;
                grandTotal += priceCalc.finalPrice;

                // Store order item data
                orderItemsData.push({
                    productId: product.id,
                    productName: product.name,
                    productCategory: product.category || null,
                    metal: product.metal || null,
                    metalPurity: product.metal_purity || null,
                    weight: priceCalc.jewelWeight,
                    wastagePercentage: priceCalc.wastagePercentage,
                    wastageWeight: priceCalc.wastageWeight,
                    totalWeight: priceCalc.totalWeight,
                    metalRatePerGram: priceCalc.metalRatePerGram,
                    metalValue: priceCalc.metalValue,
                    wastageValue: priceCalc.wastageValue,
                    basePrice: priceCalc.basePrice,
                    gstPercentage: priceCalc.gstPercentage,
                    gstAmount: priceCalc.gstAmount,
                    finalPrice: priceCalc.finalPrice
                });
            }

            // Create order record
            const [orderResult] = await connection.query(
                `INSERT INTO orders (user_id, total_amount, total_gst, grand_total, order_status)
                 VALUES (?, ?, ?, ?, 'pending')`,
                [userId, totalAmount, totalGst, grandTotal]
            );

            const orderId = orderResult.insertId;

            // Insert order items
            for (const item of orderItemsData) {
                await connection.query(
                    `INSERT INTO order_items (
                        order_id, product_id, product_name, product_category, metal, metal_purity,
                        weight, wastage_percentage, wastage_weight, total_weight,
                        metal_rate_per_gram, metal_value, wastage_value, base_price,
                        gst_percentage, gst_amount, final_price
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        orderId, item.productId, item.productName, item.productCategory,
                        item.metal, item.metalPurity, item.weight, item.wastagePercentage,
                        item.wastageWeight, item.totalWeight, item.metalRatePerGram,
                        item.metalValue, item.wastageValue, item.basePrice,
                        item.gstPercentage, item.gstAmount, item.finalPrice
                    ]
                );
            }

            // Commit transaction
            await connection.commit();

            // Fetch the created order with items
            const [orderData] = await connection.query(
                `SELECT * FROM orders WHERE order_id = ?`,
                [orderId]
            );

            const [itemsData] = await connection.query(
                `SELECT * FROM order_items WHERE order_id = ?`,
                [orderId]
            );

            sendSuccess(res, {
                order: {
                    ...orderData[0],
                    items: itemsData
                }
            }, 'Order created successfully', 201);

        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        next(error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * @desc    Get all orders for authenticated user
 * @route   GET /api/orders
 * @access  Private (Authenticated users)
 */
const getAllOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Get total count
        const [countResult] = await query(
            'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
            [userId]
        );
        const total = countResult.total;

        // Get orders with pagination
        const orders = await query(
            `SELECT * FROM orders 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        // Get items for each order
        for (let order of orders) {
            const items = await query(
                'SELECT * FROM order_items WHERE order_id = ?',
                [order.order_id]
            );
            order.items = items;
        }

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
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Private (User can view own orders, Admin can view all)
 */
const getOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Get order
        const orders = await query(
            'SELECT * FROM orders WHERE order_id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            return next(new AppError('Order not found', 404));
        }

        const order = orders[0];

        // Check authorization (user can only view their own orders unless admin)
        if (!isAdmin && order.user_id !== userId) {
            return next(new AppError('Not authorized to view this order', 403));
        }

        // Get order items
        const items = await query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId]
        );

        order.items = items;

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

        // Get total count
        const [countResult] = await query('SELECT COUNT(*) as total FROM orders');
        const total = countResult.total;

        // Get all orders with user information
        const orders = await query(
            `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        // Get items for each order
        for (let order of orders) {
            const items = await query(
                'SELECT * FROM order_items WHERE order_id = ?',
                [order.order_id]
            );
            order.items = items;
        }

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
 * @desc    Update order status (Admin only)
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin only)
 */
const updateOrderStatus = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        // Check if order exists
        const orders = await query(
            'SELECT * FROM orders WHERE order_id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            return next(new AppError('Order not found', 404));
        }

        // Update status
        await query(
            'UPDATE orders SET order_status = ? WHERE order_id = ?',
            [status, orderId]
        );

        // Fetch updated order with items
        const [updatedOrder] = await query(
            'SELECT * FROM orders WHERE order_id = ?',
            [orderId]
        );

        const items = await query(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId]
        );

        updatedOrder.items = items;

        sendSuccess(res, {
            order: updatedOrder
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
