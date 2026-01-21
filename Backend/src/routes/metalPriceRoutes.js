/**
 * Metal Price Routes
 */

const express = require('express');
const router = express.Router();
const {
    getAllMetalPrices,
    updateMetalPrice
} = require('../controllers/metalPriceController');
const { validateMetalPriceUpdate } = require('../middleware/validators');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllMetalPrices);

// Admin routes
router.put('/:metalName', protect, authorize('admin'), validateMetalPriceUpdate, updateMetalPrice);

module.exports = router;
