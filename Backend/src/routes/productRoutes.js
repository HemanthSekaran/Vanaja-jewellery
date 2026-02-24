const express = require('express');
const router = express.Router();
const multer = require('multer');
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
const { downloadTemplate, uploadProductsFromExcel } = require('../controllers/productBulkController');
const { validateProduct, validateProductUpdate, validateId } = require('../middleware/validators');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');

// In-memory multer for Excel upload (no files stored to disk)
const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel',                                           // .xls
        ];
        if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/i)) {
            return cb(null, true);
        }
        cb(new Error('Only Excel files (.xlsx, .xls) are accepted'), false);
    },
});

// Public routes
router.get('/', getAllProducts);
router.get('/categories/list', getCategories);
router.get('/top-selling', getTopSellingProducts);
router.get('/featured', getFeaturedProducts);

// Protected user routes - must come before /:id route
router.get('/user/cart', protect, getUserCartProducts);
router.get('/user/wishlist', protect, getUserWishlistProducts);

// Admin bulk-upload routes (must also come before /:id)
router.get('/bulk/template', protect, authorize('admin'), downloadTemplate);
router.post('/bulk/upload',  protect, authorize('admin'), memoryUpload.single('file'), uploadProductsFromExcel);

router.get('/:id', validateId, getProduct);

// Admin routes
router.post('/', protect, authorize('admin'), uploadMultiple('images', 5), validateProduct, createProduct);
router.put('/:id', protect, authorize('admin'), uploadMultiple('images', 5), validateId, validateProductUpdate, updateProduct);
router.delete('/:id', protect, authorize('admin'), validateId, deleteProduct);

module.exports = router;
