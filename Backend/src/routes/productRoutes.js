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
    getCategories
} = require('../controllers/productController');
const { validateProduct, validateProductUpdate, validateId } = require('../middleware/validators');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// Public routes
router.get('/', getAllProducts);
router.get('/categories/list', getCategories);
router.get('/:id', validateId, getProduct);

// Admin routes
router.post('/', protect, authorize('admin'), uploadSingle('image'), validateProduct, createProduct);
router.put('/:id', protect, authorize('admin'), uploadSingle('image'), validateId, validateProductUpdate, updateProduct);
router.delete('/:id', protect, authorize('admin'), validateId, deleteProduct);

module.exports = router;
