/**
 * Order Routes
 */

const express = require('express');
const router = express.Router();
const {
    createOrder,
    getAllOrders,
    getOrderById,
    getAllOrdersAdmin,
    updateOrderStatus
} = require('../controllers/orderController');
const { validateCheckout, validateId, validateOrderStatusUpdate } = require('../middleware/validators');
const { protect, authorize } = require('../middleware/auth');

// Protected user routes
router.post('/checkout', protect, validateCheckout, createOrder);
router.get('/', protect, getAllOrders);

// Admin routes - must come before /:id route
router.get('/admin/all', protect, authorize('admin'), getAllOrdersAdmin);
router.put('/:id/status', protect, authorize('admin'), validateId, validateOrderStatusUpdate, updateOrderStatus);

// Get single order - must come after specific routes
router.get('/:id', protect, validateId, getOrderById);

module.exports = router;
