const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderItemSchema = new mongoose.Schema({
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    prepTime: {
        type: Number,
        required: true
    }
});

const orderSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student ID is required']
    },
    canteenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Canteen',
        required: [true, 'Canteen ID is required']
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'collected', 'cancelled'],
        default: 'pending'
    },
    pickupSlot: {
        start: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        }
    },
    scheduledPrepTime: {
        type: Date
    },
    qrToken: {
        type: String,
        unique: true,
        default: () => `ORD-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`
    },
    confirmedAt: Date,
    preparedAt: Date,
    collectedAt: Date,
    cancelledAt: Date,
    cancellationReason: String
}, {
    timestamps: true
});

// Indexes for faster queries
orderSchema.index({ studentId: 1, status: 1 });
orderSchema.index({ canteenId: 1, status: 1 });
orderSchema.index({ qrToken: 1 });
orderSchema.index({ 'pickupSlot.start': 1 });

module.exports = mongoose.model('Order', orderSchema);
