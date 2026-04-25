const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
    return jwt.sign({ userId, type: 'refresh' }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn
    });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }),
        body('displayName').optional().trim(),
        body('dietaryRestrictions').optional().isArray(),
        body('preferences').optional().isObject()
    ],
    async (req, res, next) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError(
                    'Validation failed',
                    400,
                    'VALIDATION_ERROR'
                );
            }

            const { email, password, displayName, dietaryRestrictions, preferences } = req.body;

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                throw new AppError(
                    'User with this email already exists',
                    409,
                    'USER_EXISTS'
                );
            }

            // Create user
            const user = await User.create({
                email,
                password,
                displayName,
                dietaryRestrictions,
                preferences
            });

            // Generate tokens
            const token = generateToken(user.id);
            const refreshToken = generateRefreshToken(user.id);

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        displayName: user.display_name,
                        avatarUrl: user.avatar_url,
                        dietaryRestrictions: user.dietary_restrictions,
                        preferences: user.preferences
                    },
                    token,
                    refreshToken
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/auth/login
// @desc    Authenticate user and return token
// @access  Public
router.post('/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req, res, next) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError(
                    'Validation failed',
                    400,
                    'VALIDATION_ERROR'
                );
            }

            const { email, password } = req.body;

            // Find user
            const user = await User.findByEmail(email);
            if (!user) {
                throw new AppError(
                    'Invalid credentials',
                    401,
                    'INVALID_CREDENTIALS'
                );
            }

            // Verify password
            const isValid = await User.verifyPassword(email, password);
            if (!isValid) {
                throw new AppError(
                    'Invalid credentials',
                    401,
                    'INVALID_CREDENTIALS'
                );
            }

            // Generate tokens
            const token = generateToken(user.id);
            const refreshToken = generateRefreshToken(user.id);

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        displayName: user.display_name,
                        avatarUrl: user.avatar_url,
                        dietaryRestrictions: user.dietary_restrictions,
                        preferences: user.preferences
                    },
                    token,
                    refreshToken
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh',
    [
        body('refreshToken').notEmpty()
    ],
    async (req, res, next) => {
        try {
            const { refreshToken } = req.body;

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
            if (decoded.type !== 'refresh') {
                throw new AppError(
                    'Invalid token type',
                    401,
                    'INVALID_TOKEN_TYPE'
                );
            }

            // Find user
            const user = await User.findById(decoded.userId);
            if (!user) {
                throw new AppError(
                    'User not found',
                    404,
                    'USER_NOT_FOUND'
                );
            }

            // Generate new tokens
            const newToken = generateToken(user.id);
            const newRefreshToken = generateRefreshToken(user.id);

            res.json({
                success: true,
                data: {
                    token: newToken,
                    refreshToken: newRefreshToken
                }
            });
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired refresh token',
                    code: 'INVALID_REFRESH_TOKEN'
                });
            }
            next(error);
        }
    }
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: {
                id: req.user.id,
                email: req.user.email,
                displayName: req.user.display_name,
                avatarUrl: req.user.avatar_url,
                dietaryRestrictions: req.user.dietary_restrictions,
                preferences: req.user.preferences
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile',
    authenticate,
    [
        body('displayName').optional().trim(),
        body('avatarUrl').optional().isURL(),
        body('dietaryRestrictions').optional().isArray(),
        body('preferences').optional().isObject()
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError(
                    'Validation failed',
                    400,
                    'VALIDATION_ERROR'
                );
            }

            const { displayName, avatarUrl, dietaryRestrictions, preferences } = req.body;

            const user = await User.update(req.user.id, {
                displayName,
                avatarUrl,
                dietaryRestrictions,
                preferences
            });

            res.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    displayName: user.display_name,
                    avatarUrl: user.avatar_url,
                    dietaryRestrictions: user.dietary_restrictions,
                    preferences: user.preferences
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authenticate, async (req, res, next) => {
    try {
        const result = await User.delete(req.user.id);
        if (!result) {
            throw new AppError(
                'Failed to delete account',
                500,
                'DELETE_FAILED'
            );
        }

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;