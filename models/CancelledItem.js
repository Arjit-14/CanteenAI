const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const cancelledItemSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    originalStudentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    canteenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Canteen',
        required: true
    },
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    itemName: {
        type: String,
        required: true
    },
    originalPrice: {
        type: Number,
        required: true
    },
    discountedPrice: {
        type: Number,
        required: true
    },
    discountPercent: {
        type: Number,
        required: true,
        default: 10,
        min: 5,
        max: 15
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    status: {
        type: String,
        enum: ['available', 'claimed', 'expired'],
        default: 'available'
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    },
    claimQrToken: {
        type: String,
        default: () => `CLM-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`
    },
    expiresAt: {
        type: Date,
        required: true
    },
    claimedAt: Date
}, {
    timestamps: true
});

// Index for faster queries
cancelledItemSchema.index({ canteenId: 1, status: 1 });
cancelledItemSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('CancelledItem', cancelledItemSchema);
