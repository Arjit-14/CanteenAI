const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Canteen = require('../models/Canteen');
const CancelledItem = require('../models/CancelledItem');
const AIScheduler = require('../services/aiScheduler');
const QRService = require('../services/qrService');
const { emitOrderUpdate, emitNewOrder, emitCancelledItem } = require('../services/websocketService');

/**
 * Create new order
 * POST /api/orders
 */
const createOrder = async (req, res, next) => {
    try {
        const { canteenId, items, pickupSlot } = req.body;
        const studentId = req.userId;

        // Validate canteen
        const canteen = await Canteen.findById(canteenId);
        if (!canteen || !canteen.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Canteen not found or inactive'
            });
        }

        // Fetch menu items and calculate totals
        const orderItems = [];
        let totalAmount = 0;

        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItemId);
            if (!menuItem || !menuItem.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `Item ${item.menuItemId} not available`
                });
            }

            orderItems.push({
                menuItemId: menuItem._id,
                name: menuItem.name,
                quantity: item.quantity,
                price: menuItem.price,
                prepTime: menuItem.prepTime
            });

            totalAmount += menuItem.price * item.quantity;
        }

        // AI Scheduling - Check slot feasibility
        const scheduler = new AIScheduler(canteen.kitchenCapacity);
        const pickupTime = new Date(pickupSlot.start);

        // Get active orders for this canteen
        const activeOrders = await Order.find({
            canteenId,
            status: { $in: ['confirmed', 'preparing'] }
        });

        const slotCheck = scheduler.checkSlotFeasibility(
            pickupTime,
            orderItems,
            activeOrders
        );

        if (!slotCheck.feasible) {
            return res.status(200).json({
                success: true,
                slotFeasible: false,
                reason: slotCheck.reason,
                suggestedSlot: slotCheck.suggestedSlot,
                currentLoad: slotCheck.currentLoad,
                effectiveCapacity: slotCheck.effectiveCapacity,
                rushIntensity: slotCheck.rushIntensity
            });
        }

        // Create order
        const order = await Order.create({
            studentId,
            canteenId,
            items: orderItems,
            totalAmount,
            status: 'confirmed',
            pickupSlot: {
                start: new Date(pickupSlot.start),
                end: new Date(pickupSlot.end)
            },
            scheduledPrepTime: slotCheck.scheduledPrepTime,
            confirmedAt: new Date()
        });

        // Generate QR code
        const qrCode = await QRService.generateQR(order.qrToken);

        // Emit real-time update to vendor
        emitNewOrder(order, req.user.name);

        res.status(201).json({
            success: true,
            slotFeasible: true,
            order: {
                _id: order._id,
                qrToken: order.qrToken,
                qrCode,
                status: order.status,
                pickupSlot: order.pickupSlot,
                scheduledPrepTime: order.scheduledPrepTime,
                totalAmount: order.totalAmount,
                items: order.items
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get student's orders
 * GET /api/orders
 */
const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ studentId: req.userId })
            .populate('canteenId', 'name location')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single order
 * GET /api/orders/:id
 */
const getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('canteenId', 'name location')
            .populate('studentId', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Generate QR code
        const qrCode = await QRService.generateQR(order.qrToken);

        res.status(200).json({
            success: true,
            data: {
                ...order.toObject(),
                qrCode
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel order
 * POST /api/orders/:id/cancel
 */
const cancelOrder = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order belongs to user
        if (order.studentId.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this order'
            });
        }

        // Check if order can be cancelled
        if (['collected', 'cancelled'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled'
            });
        }

        // If food is already prepared, create cancelled items for reuse
        const cancelledItems = [];
        if (['preparing', 'ready'].includes(order.status)) {
            for (const item of order.items) {
                const discountPercent = 10; // 10% discount
                const discountedPrice = Math.round(item.price * (1 - discountPercent / 100));

                const cancelledItem = await CancelledItem.create({
                    orderId: order._id,
                    originalStudentId: order.studentId,
                    canteenId: order.canteenId,
                    menuItemId: item.menuItemId,
                    itemName: item.name,
                    originalPrice: item.price,
                    discountedPrice,
                    discountPercent,
                    quantity: item.quantity,
                    expiresAt: new Date(Date.now() + 30 * 60000) // 30 min expiry
                });

                cancelledItems.push(cancelledItem);

                // Broadcast to students
                emitCancelledItem(order.canteenId, cancelledItem);
            }
        }

        // Update order status
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = reason;
        await order.save();

        // Emit update
        emitOrderUpdate(order);

        res.status(200).json({
            success: true,
            message: 'Order cancelled',
            refundStatus: order.status === 'confirmed' ? 'full' : 'partial',
            cancelledItems
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get available time slots
 * GET /api/orders/slots/:canteenId
 */
const getTimeSlots = async (req, res, next) => {
    try {
        const { canteenId } = req.params;
        const canteen = await Canteen.findById(canteenId);

        if (!canteen) {
            return res.status(404).json({
                success: false,
                message: 'Canteen not found'
            });
        }

        const scheduler = new AIScheduler(canteen.kitchenCapacity);
        const slots = scheduler.generateTimeSlots(4, 10);

        res.status(200).json({
            success: true,
            canteenId,
            data: slots
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrder,
    cancelOrder,
    getTimeSlots
};
