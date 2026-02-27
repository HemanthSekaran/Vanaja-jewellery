/**
 * Order Controller
 * Handles checkout and order operations using the standalone order_items table.
 * Each product selected by the user creates one row in order_items with its
 * own unique order_id (auto-increment integer).
 *
 * Checkout body:
 *   productIds    : number[]           – required
 *   weights       : (number|null)[]    – optional per-product user-supplied weight (g)
 *   sizes         : (string|null)[]    – optional size for Bangles / Rings / Stone rings
 *   chain_lengths : (number|null)[]    – optional chain length (18|20|22|24) for Chains
 */

const { query } = require('../config/database');
const { sendSuccess } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const { calculatePrice } = require('../utils/priceCalculator');
const { getMetalPriceForProduct, getGSTPercentage } = require('../utils/metalPriceHelper');
const { sendOrderNotification } = require('../utils/emailService');

const VALID_CHAIN_LENGTHS = [18, 20, 22, 24];

/** Parse product image JSON field into an array of filenames */
const parseProductImages = (imageField) => {
    if (!imageField) return [];
    try {
        const parsed = JSON.parse(imageField);
        return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
        return [imageField];
    }
};

/**
 * @desc    Create order (Checkout)
 * @route   POST /api/orders/checkout
 * @access  Private (Authenticated users)
 */
const createOrder = async (req, res, next) => {
    let connection;

    try {
        const { productIds, weights = [], sizes = [], chain_lengths = [] } = req.body;
        const userId = req.user.id;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return next(new AppError('Please provide an array of product IDs', 400));
        }

        const { getConnection } = require('../config/database');
        connection = await getConnection();
        await connection.beginTransaction();

        try {
            const gstPercentage = await getGSTPercentage();
            const { fetchMetalPrices } = require('../utils/metalPriceHelper');
            const metalPriceMap = await fetchMetalPrices();

            const createdOrderIds = [];

            for (let i = 0; i < productIds.length; i++) {
                const productId = productIds[i];

                // Optional per-product weight
                const userWeight = (weights[i] != null && !isNaN(parseFloat(weights[i])) && parseFloat(weights[i]) > 0)
                    ? parseFloat(weights[i]) : null;

                // Optional size (Bangles / Rings / Stone rings)
                const userSize = (sizes[i] != null && String(sizes[i]).trim() !== '')
                    ? String(sizes[i]).trim() : null;

                // Optional chain length (Chains only) — must be 18 | 20 | 22 | 24
                let chainLength = null;
                if (chain_lengths[i] != null) {
                    const cl = parseInt(chain_lengths[i], 10);
                    if (!VALID_CHAIN_LENGTHS.includes(cl)) {
                        throw new AppError(`Chain length must be one of ${VALID_CHAIN_LENGTHS.join(', ')} inches`, 400);
                    }
                    chainLength = cl;
                }

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

                const effectiveWeight = userWeight !== null ? userWeight : product.weight;

                if (!effectiveWeight || effectiveWeight <= 0) {
                    throw new AppError(
                        `Product "${product.name}" has no weight. Please provide a weight for this item.`,
                        400
                    );
                }

                // Calculate price using effective weight
                const metalRatePerGram = getMetalPriceForProduct(product, metalPriceMap);
                const priceCalc = calculatePrice(
                    effectiveWeight,
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
                        user_id, request, work_status,
                        product_id, product_name, product_category, metal, metal_purity,
                        weight, wastage_percentage, wastage_weight, total_weight,
                        metal_rate_per_gram, metal_value, wastage_value, base_price,
                        gst_percentage, gst_amount, final_price,
                        user_weight, size, chain_length
                    ) VALUES (?, 'Not Viewed', 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                        priceCalc.finalPrice,
                        userWeight,
                        userSize,
                        chainLength
                    ]
                );

                createdOrderIds.push(result.insertId);
            }

            await connection.commit();

            // Return newly created items with product images
            const placeholders = createdOrderIds.map(() => '?').join(', ');
            const [createdItems] = await connection.query(
                `SELECT oi.*, p.image AS product_image
                 FROM order_items oi
                 LEFT JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id IN (${placeholders})
                 ORDER BY oi.order_id ASC`,
                createdOrderIds
            );

            const enrichedItems = createdItems.map(item => ({
                ...item,
                product_images: parseProductImages(item.product_image),
            }));

            sendOrderNotification(enrichedItems, req.user).catch(() => {});

            sendSuccess(res, { orders: enrichedItems }, 'Order placed successfully', 201);

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
            `SELECT oi.*, p.image AS product_image
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.user_id = ?
             ORDER BY oi.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const enrichedOrders = orders.map(order => ({
            ...order,
            product_images: parseProductImages(order.product_image),
        }));

        sendSuccess(res, {
            orders: enrichedOrders,
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
 * @access  Private (User – own only; Admin – any)
 */
const getOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const orders = await query(
            `SELECT oi.*, p.image AS product_image
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        if (!orders || orders.length === 0) {
            return next(new AppError('Order not found', 404));
        }

        const order = {
            ...orders[0],
            product_images: parseProductImages(orders[0].product_image),
        };

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

        const countResult = await query('SELECT COUNT(*) AS total FROM order_items');
        const total = countResult[0].total;

        const orders = await query(
            `SELECT oi.*, p.image AS product_image,
                    u.name AS user_name, u.email AS user_email, u.phone AS user_phone
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             LEFT JOIN users u    ON oi.user_id   = u.id
             ORDER BY oi.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const enrichedOrders = orders.map(order => ({
            ...order,
            product_images: parseProductImages(order.product_image),
        }));

        sendSuccess(res, {
            orders: enrichedOrders,
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
 * @desc    Update order request / work_status (Admin only)
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin only)
 */
const updateOrderStatus = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { request, work_status } = req.body;

        const orders = await query(
            'SELECT order_id FROM order_items WHERE order_id = ?',
            [orderId]
        );

        if (!orders || orders.length === 0) {
            return next(new AppError('Order not found', 404));
        }

        const updates = [];
        const values = [];

        if (request !== undefined) {
            updates.push('request = ?');
            values.push(request);
        }
        if (work_status !== undefined) {
            updates.push('work_status = ?');
            values.push(work_status);
        }

        if (updates.length === 0) {
            return next(new AppError('Please provide request and/or work_status to update', 400));
        }

        values.push(orderId);
        await query(
            `UPDATE order_items SET ${updates.join(', ')} WHERE order_id = ?`,
            values
        );

        const updatedOrders = await query(
            `SELECT oi.*, p.image AS product_image
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        const order = {
            ...updatedOrders[0],
            product_images: parseProductImages(updatedOrders[0].product_image),
        };

        sendSuccess(res, { order }, 'Order status updated successfully');

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
