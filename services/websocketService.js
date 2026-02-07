/**
 * WebSocket Service
 * Handles real-time updates for orders
 */

let io = null;

const initializeWebSocket = (server) => {
    const { Server } = require('socket.io');

    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Join student room
        socket.on('join-student', (studentId) => {
            socket.join(`student-${studentId}`);
            console.log(`Student ${studentId} joined their room`);
        });

        // Join vendor room for a specific canteen
        socket.on('join-vendor', (canteenId) => {
            socket.join(`canteen-${canteenId}`);
            console.log(`Vendor joined canteen ${canteenId}`);
        });

        // Join cancelled items room
        socket.on('join-cancelled-items', (canteenId) => {
            socket.join(`cancelled-${canteenId}`);
            console.log(`User watching cancelled items for canteen ${canteenId}`);
        });

        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

/**
 * Emit order update to student and vendor
 */
const emitOrderUpdate = (order) => {
    if (!io) return;

    // Notify student
    io.to(`student-${order.studentId}`).emit('order-update', {
        orderId: order._id,
        status: order.status,
        qrToken: order.qrToken
    });

    // Notify vendor
    io.to(`canteen-${order.canteenId}`).emit('order-update', {
        orderId: order._id,
        status: order.status,
        items: order.items,
        pickupSlot: order.pickupSlot
    });
};

/**
 * Emit new order to vendor
 */
const emitNewOrder = (order, studentName) => {
    if (!io) return;

    io.to(`canteen-${order.canteenId}`).emit('new-order', {
        orderId: order._id,
        studentName,
        items: order.items,
        totalAmount: order.totalAmount,
        pickupSlot: order.pickupSlot,
        scheduledPrepTime: order.scheduledPrepTime,
        qrToken: order.qrToken
    });
};

/**
 * Emit cancelled item available
 */
const emitCancelledItem = (canteenId, cancelledItem) => {
    if (!io) return;

    io.to(`cancelled-${canteenId}`).emit('cancelled-item-available', {
        itemId: cancelledItem._id,
        itemName: cancelledItem.itemName,
        originalPrice: cancelledItem.originalPrice,
        discountedPrice: cancelledItem.discountedPrice,
        discountPercent: cancelledItem.discountPercent,
        expiresAt: cancelledItem.expiresAt
    });
};

/**
 * Emit preparation reminder to vendor
 */
const emitPrepReminder = (canteenId, order) => {
    if (!io) return;

    io.to(`canteen-${canteenId}`).emit('prep-reminder', {
        orderId: order._id,
        items: order.items,
        pickupSlot: order.pickupSlot,
        message: 'Time to start preparing this order!'
    });
};

module.exports = {
    initializeWebSocket,
    emitOrderUpdate,
    emitNewOrder,
    emitCancelledItem,
    emitPrepReminder
};
