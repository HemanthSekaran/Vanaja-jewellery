/**
 * Custom Design Routes
 */

const express = require('express');
const router = express.Router();
const {
    createDesign,
    getUserDesigns,
    getDesign,
    getAllDesigns,
    updateDesignStatus
} = require('../controllers/designController');
const { validateCustomDesign, validateId } = require('../middleware/validators');
const { protect, authorize } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// User routes (authenticated)
router.post('/', protect, uploadSingle('reference_image'), validateCustomDesign, createDesign);
router.get('/', protect, getUserDesigns);
router.get('/:id', protect, validateId, getDesign);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllDesigns);
router.put('/:id/status', protect, authorize('admin'), validateId, updateDesignStatus);

module.exports = router;
