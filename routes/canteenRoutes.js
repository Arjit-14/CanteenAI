const express = require('express');
const router = express.Router();
const {
    getAllCanteens,
    getCanteen,
    createCanteen,
    updateCanteen
} = require('../controllers/canteenController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAllCanteens);
router.get('/:id', getCanteen);

// Admin routes
router.post('/', protect, adminOnly, createCanteen);
router.put('/:id', protect, adminOnly, updateCanteen);

module.exports = router;
