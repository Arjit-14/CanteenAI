const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getOrder,
    cancelOrder,
    getTimeSlots
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/slots/:canteenId', getTimeSlots);
router.get('/:id', getOrder);
router.post('/:id/cancel', cancelOrder);

module.exports = router;
