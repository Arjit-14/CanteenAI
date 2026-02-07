const mongoose = require('mongoose');

const canteenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Canteen name is required'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    image: {
        type: String,
        default: '/images/canteen-default.jpg'
    },
    openTime: {
        type: String,
        required: true,
        default: '08:00'
    },
    closeTime: {
        type: String,
        required: true,
        default: '18:00'
    },
    kitchenCapacity: {
        type: Number,
        required: true,
        default: 5,
        min: 1,
        max: 20
    },
    isActive: {
        type: Boolean,
        default: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Canteen', canteenSchema);
