const { verifyToken } = require('../config/jwt');
const Student = require('../models/Student');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        // Verify token
        const decoded = verifyToken(token);

        // Find user
        const user = await Student.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

/**
 * Vendor only middleware
 */
const vendorOnly = (req, res, next) => {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Only vendors can access this route'
        });
    }
    next();
};

/**
 * Admin only middleware
 */
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Only admins can access this route'
        });
    }
    next();
};

module.exports = { protect, vendorOnly, adminOnly };
