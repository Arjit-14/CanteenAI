const Student = require('../models/Student');
const { generateToken } = require('../config/jwt');

/**
 * Register a new student
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, studentId, department, role } = req.body;

        // Check if user already exists
        const existingUser = await Student.findOne({
            $or: [{ email }, { studentId }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or student ID already exists'
            });
        }

        // Create user
        const user = await Student.create({
            name,
            email,
            password,
            phone,
            studentId,
            department,
            role: role || 'student'
        });

        // Generate token
        const token = generateToken(user._id, user.role);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user with password
        const user = await Student.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id, user.role);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
    try {
        const user = await Student.findById(req.userId);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                department: user.department,
                phone: user.phone
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe };
