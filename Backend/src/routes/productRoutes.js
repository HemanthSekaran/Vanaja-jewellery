/**
 * Product Routes
 */

const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories,
    getTopSellingProducts,
    getFeaturedProducts,
    getUserCartProducts,
    getUserWishlistProducts
} = require('../controllers/productController');
const { validateProduct, validateProductUpdate, validateId } = require('../middleware/validators');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');

// Public routes
router.get('/', getAllProducts);
router.get('/categories/list', getCategories);
router.get('/top-selling', getTopSellingProducts);
router.get('/featured', getFeaturedProducts);

// Protected user routes - must come before /:id route
router.get('/user/cart', protect, getUserCartProducts);
router.get('/user/wishlist', protect, getUserWishlistProducts);

router.get('/:id', validateId, getProduct);

// Admin routes
router.post('/', protect, authorize('admin'), uploadMultiple('images', 5), validateProduct, createProduct);
router.put('/:id', protect, authorize('admin'), uploadMultiple('images', 5), validateId, validateProductUpdate, updateProduct);
router.delete('/:id', protect, authorize('admin'), validateId, deleteProduct);

module.exports = router;
