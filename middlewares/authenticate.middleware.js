const createError = require('http-errors');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(createError(401, 'Access token is required'));
        }

        const token = authHeader.startsWith('Bearer') ? authHeader.split(' ')[1] : authHeader;

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // get user
        const user = await User.findByPk(decoded.id);
        
        if (!user) return next(createError(401, 'User not found'));
        if (!user.isActive) return next(createError(403, 'Your account has been locked. Please contact administrator'));

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(createError(401, 'Invalid token'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(createError(401, 'Token expired'));
        }
        next(error);
    }
};

module.exports = { authenticate }