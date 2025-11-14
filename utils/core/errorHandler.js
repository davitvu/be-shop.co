const { NotFoundError } = require("./errorResponse");

const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    }
}

const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || err.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        error: {
            statusCode,
            message: err.message || 'Internal Server Error',
            details: err.details,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};

const endpointNotFound = (req, res, next) => next(new NotFoundError('Endpoint not found'));

module.exports = { errorHandler, endpointNotFound };