const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    canteenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Canteen',
        required: [true, 'Canteen ID is required']
    },
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Desserts'],
        default: 'Snacks'
    },
    image: {
        type: String,
        default: '/images/food-default.jpg'
    },
    prepTime: {
        type: Number,
        required: true,
        default: 10,
        min: 1,
        max: 60
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    ingredients: [{
        type: String
    }]
}, {
    timestamps: true
});

// Index for faster queries
menuItemSchema.index({ canteenId: 1, isAvailable: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
