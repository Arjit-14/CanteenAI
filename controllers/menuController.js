const MenuItem = require('../models/MenuItem');

/**
 * Get menu items for a canteen
 * GET /api/menu/:canteenId
 */
const getMenuByCanteen = async (req, res, next) => {
    try {
        const { canteenId } = req.params;
        const { category, available } = req.query;

        const query = { canteenId };

        if (category) {
            query.category = category;
        }

        if (available !== undefined) {
            query.isAvailable = available === 'true';
        }

        const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });

        // Group by category
        const groupedMenu = menuItems.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            canteenId,
            count: menuItems.length,
            data: menuItems,
            grouped: groupedMenu
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single menu item
 * GET /api/menu/item/:id
 */
const getMenuItem = async (req, res, next) => {
    try {
        const item = await MenuItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create menu item (Vendor/Admin)
 * POST /api/menu
 */
const createMenuItem = async (req, res, next) => {
    try {
        const item = await MenuItem.create(req.body);

        res.status(201).json({
            success: true,
            data: item
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update menu item
 * PUT /api/menu/:id
 */
const updateMenuItem = async (req, res, next) => {
    try {
        const item = await MenuItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle item availability
 * PATCH /api/menu/:id/availability
 */
const toggleAvailability = async (req, res, next) => {
    try {
        const item = await MenuItem.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        item.isAvailable = !item.isAvailable;
        await item.save();

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMenuByCanteen,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    toggleAvailability
};
