const config = require('../config');

class AppError extends Error {
    constructor(message, statusCode, code = 'APPLICATION_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let code = err.code || 'INTERNAL_ERROR';

    // Log error for debugging
    if (config.nodeEnv === 'development') {
        console.error('Error:', err);
    } else {
        console.error('Error:', { message, code, statusCode });
    }

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        code = 'VALIDATION_ERROR';
    }

    if (err.code === '23505') {
        statusCode = 409;
        code = 'CONFLICT_ERROR';
        message = 'Resource already exists';
    }

    if (err.code === '23503') {
        statusCode = 400;
        code = 'FOREIGN_KEY_ERROR';
        message = 'Referenced resource not found';
    }

    // Don't leak error details in production
    if (config.nodeEnv === 'production' && err.isOperational !== true) {
        message = 'Something went wrong';
        code = 'INTERNAL_ERROR';
    }

    res.status(statusCode).json({
        success: false,
        message,
        code,
        ...(config.nodeEnv === 'development' && { stack: err.stack })
    });
};

const notFound = (req, res, next) => {
    const error = new AppError(
        `Route ${req.originalUrl} not found`,
        404,
        'ROUTE_NOT_FOUND'
    );
    next(error);
};

module.exports = {
    AppError,
    errorHandler,
    notFound
};