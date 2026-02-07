const express = require('express');
const router = express.Router();
const {
    getVendorOrders,
    updateOrderStatus,
    scanQRCode,
    getCancelledItems,
    claimCancelledItem
} = require('../controllers/vendorController');
const { protect, vendorOnly } = require('../middleware/authMiddleware');

// Vendor-only routes
router.get('/orders/:canteenId', protect, vendorOnly, getVendorOrders);
router.patch('/orders/:orderId/status', protect, vendorOnly, updateOrderStatus);
router.post('/scan-qr', protect, vendorOnly, scanQRCode);

// Cancelled items (available to all authenticated users)
router.get('/cancelled/:canteenId', protect, getCancelledItems);
router.post('/cancelled/:itemId/claim', protect, claimCancelledItem);

module.exports = router;
