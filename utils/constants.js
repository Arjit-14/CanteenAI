// Application constants
module.exports = {
    ORDER_STATUS: {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        PREPARING: 'preparing',
        READY: 'ready',
        COLLECTED: 'collected',
        CANCELLED: 'cancelled'
    },

    MENU_CATEGORIES: [
        'Breakfast',
        'Lunch',
        'Snacks',
        'Beverages',
        'Desserts'
    ],

    USER_ROLES: {
        STUDENT: 'student',
        VENDOR: 'vendor',
        ADMIN: 'admin'
    },

    CANCELLED_ITEM_STATUS: {
        AVAILABLE: 'available',
        CLAIMED: 'claimed',
        EXPIRED: 'expired'
    },

    DISCOUNT_PERCENT: 10,
    CANCELLED_ITEM_EXPIRY_MINUTES: 30,
    BUFFER_TIME_MINUTES: 2,
    DEFAULT_KITCHEN_CAPACITY: 5
};
