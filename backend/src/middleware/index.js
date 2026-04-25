const { authenticate, optionalAuth } = require('./auth');
const { AppError, errorHandler, notFound } = require('./errorHandler');

module.exports = {
    authenticate,
    optionalAuth,
    AppError,
    errorHandler,
    notFound
};