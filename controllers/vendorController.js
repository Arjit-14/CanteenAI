const Order = require('../models/Order');
const CancelledItem = require('../models/CancelledItem');
const QRService = require('../services/qrService');
const { emitOrderUpdate } = require('../services/websocketService');

/**
 * Get all orders for a canteen (Vendor view)
 * GET /api/vendor/orders/:canteenId
 */
const getVendorOrders = async (req, res, next) => {
    try {
        const { canteenId } = req.params;
        const { status } = req.query;

        const query = { canteenId };

        if (status) {
            query.status = status;
        } else {
            // By default, show active orders
            query.status = { $in: ['confirmed', 'preparing', 'ready'] };
        }

        const orders = await Order.find(query)
            .populate('studentId', 'name phone')
            .sort({ scheduledPrepTime: 1 });

        // Calculate time until prep for each order
        const now = new Date();
        const ordersWithTiming = orders.map(order => {
            const prepTime = new Date(order.scheduledPrepTime);
            const timeUntilPrep = Math.round((prepTime - now) / 60000); // in minutes

            return {
                ...order.toObject(),
                timeUntilPrep,
                isUrgent: timeUntilPrep <= 5 && order.status === 'confirmed'
            };
        });

        res.status(200).json({
            success: true,
            count: ordersWithTiming.length,
            data: ordersWithTiming
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update order status
 * PATCH /api/vendor/orders/:orderId/status
 */
const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validTransitions = {
            'confirmed': ['preparing', 'cancelled'],
            'preparing': ['ready', 'cancelled'],
            'ready': ['collected']
        };

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Validate status transition
        if (!validTransitions[order.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${order.status} to ${status}`
            });
        }

        order.status = status;

        // Set timestamps
        if (status === 'preparing') {
            order.preparedAt = new Date();
        } else if (status === 'collected') {
            order.collectedAt = new Date();
        }

        await order.save();

        // Emit real-time update
        emitOrderUpdate(order);

        res.status(200).json({
            success: true,
            message: 'Order status updated',
            order: {
                _id: order._id,
                status: order.status
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Scan QR code to collect order
 * POST /api/vendor/scan-qr
 */
const scanQRCode = async (req, res, next) => {
    try {
        const { qrToken } = req.body;

        // Validate token format
        const tokenCheck = QRService.validateToken(qrToken);

        if (!tokenCheck.valid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid QR code format'
            });
        }

        let result;

        if (tokenCheck.type === 'order') {
            // Regular order collection
            const order = await Order.findOne({ qrToken })
                .populate('studentId', 'name email');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            if (order.status === 'collected') {
                return res.status(400).json({
                    success: false,
                    message: 'Order already collected'
                });
            }

            if (order.status !== 'ready') {
                return res.status(400).json({
                    success: false,
                    message: `Order not ready for collection. Current status: ${order.status}`
                });
            }

            order.status = 'collected';
            order.collectedAt = new Date();
            await order.save();

            emitOrderUpdate(order);

            result = {
                type: 'order',
                orderId: order._id,
                studentName: order.studentId.name,
                items: order.items,
                totalAmount: order.totalAmount,
                status: 'collected'
            };
        } else if (tokenCheck.type === 'claim') {
            // Cancelled item claim
            const claimedItem = await CancelledItem.findOne({ claimQrToken: qrToken })
                .populate('claimedBy', 'name email');

            if (!claimedItem) {
                return res.status(404).json({
                    success: false,
                    message: 'Claimed item not found'
                });
            }

            if (claimedItem.status !== 'claimed') {
                return res.status(400).json({
                    success: false,
                    message: `Item cannot be collected. Status: ${claimedItem.status}`
                });
            }

            claimedItem.status = 'collected';
            await claimedItem.save();

            result = {
                type: 'claim',
                itemId: claimedItem._id,
                studentName: claimedItem.claimedBy?.name,
                itemName: claimedItem.itemName,
                discountedPrice: claimedItem.discountedPrice,
                status: 'collected'
            };
        }

        res.status(200).json({
            success: true,
            message: 'Collection successful',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get cancelled items for claiming
 * GET /api/vendor/cancelled/:canteenId
 */
const getCancelledItems = async (req, res, next) => {
    try {
        const { canteenId } = req.params;

        // Get available items that haven't expired
        const items = await CancelledItem.find({
            canteenId,
            status: 'available',
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Claim a cancelled item
 * POST /api/vendor/cancelled/:itemId/claim
 */
const claimCancelledItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const studentId = req.userId;

        const item = await CancelledItem.findById(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        if (item.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Item no longer available'
            });
        }

        if (new Date() > item.expiresAt) {
            item.status = 'expired';
            await item.save();
            return res.status(400).json({
                success: false,
                message: 'Item has expired'
            });
        }

        // Claim the item
        item.status = 'claimed';
        item.claimedBy = studentId;
        item.claimedAt = new Date();
        await item.save();

        // Generate QR for collection
        const qrCode = await QRService.generateQR(item.claimQrToken);

        res.status(200).json({
            success: true,
            message: 'Item claimed successfully',
            data: {
                _id: item._id,
                itemName: item.itemName,
                discountedPrice: item.discountedPrice,
                qrToken: item.claimQrToken,
                qrCode,
                pickupSlot: 'Now'
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getVendorOrders,
    updateOrderStatus,
    scanQRCode,
    getCancelledItems,
    claimCancelledItem
};
