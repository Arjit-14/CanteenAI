const Canteen = require('../models/Canteen');
const Order = require('../models/Order');

/**
 * Get all canteens
 * GET /api/canteens
 */
const getAllCanteens = async (req, res, next) => {
    try {
        const canteens = await Canteen.find({ isActive: true });

        // Add current load for each canteen
        const canteensWithLoad = await Promise.all(
            canteens.map(async (canteen) => {
                const activeOrders = await Order.countDocuments({
                    canteenId: canteen._id,
                    status: { $in: ['confirmed', 'preparing'] }
                });

                return {
                    ...canteen.toObject(),
                    currentLoad: activeOrders,
                    maxCapacity: canteen.kitchenCapacity
                };
            })
        );

        res.status(200).json({
            success: true,
            count: canteensWithLoad.length,
            data: canteensWithLoad
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single canteen
 * GET /api/canteens/:id
 */
const getCanteen = async (req, res, next) => {
    try {
        const canteen = await Canteen.findById(req.params.id);

        if (!canteen) {
            return res.status(404).json({
                success: false,
                message: 'Canteen not found'
            });
        }

        const activeOrders = await Order.countDocuments({
            canteenId: canteen._id,
            status: { $in: ['confirmed', 'preparing'] }
        });

        res.status(200).json({
            success: true,
            data: {
                ...canteen.toObject(),
                currentLoad: activeOrders,
                maxCapacity: canteen.kitchenCapacity
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create canteen (Admin only)
 * POST /api/canteens
 */
const createCanteen = async (req, res, next) => {
    try {
        const canteen = await Canteen.create(req.body);

        res.status(201).json({
            success: true,
            data: canteen
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update canteen
 * PUT /api/canteens/:id
 */
const updateCanteen = async (req, res, next) => {
    try {
        const canteen = await Canteen.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!canteen) {
            return res.status(404).json({
                success: false,
                message: 'Canteen not found'
            });
        }

        res.status(200).json({
            success: true,
            data: canteen
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllCanteens, getCanteen, createCanteen, updateCanteen };
