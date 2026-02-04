/**
 * Wastage Routes
 */

const express = require('express');
const router = express.Router();
const {
    getAllWastages,
    createWastage,
    updateWastage,
    deleteWastage
} = require('../controllers/wastageController');
const { validateWastage, validateWastageUpdate, validateId } = require('../middleware/validators');
const { protect, authorize } = require('../middleware/auth');

// Public route - for getting wastage list (used in product creation dropdown)
router.get('/', getAllWastages);

// Admin routes
router.post('/', protect, authorize('admin'), validateWastage, createWastage);
router.put('/:id', protect, authorize('admin'), validateId, validateWastageUpdate, updateWastage);
router.delete('/:id', protect, authorize('admin'), validateId, deleteWastage);

module.exports = router;
