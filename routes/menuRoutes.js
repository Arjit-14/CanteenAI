const express = require('express');
const router = express.Router();
const {
    getMenuByCanteen,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    toggleAvailability
} = require('../controllers/menuController');
const { protect, vendorOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/:canteenId', getMenuByCanteen);
router.get('/item/:id', getMenuItem);

// Vendor routes
router.post('/', protect, vendorOnly, createMenuItem);
router.put('/:id', protect, vendorOnly, updateMenuItem);
router.patch('/:id/availability', protect, vendorOnly, toggleAvailability);

module.exports = router;
