const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { AuthFailureError, NotFoundError, ForbiddenError } = require('../utils/core/errorResponse');

const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;

        if (!token) throw new AuthFailureError('Access token is required');

        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // get user
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user) throw new NotFoundError('User not found');
        if (!user.isActive) ForbiddenError('Your account has been locked. Please contact administrator');

        const { password, verificationToken, resetPasswordToken, resetPasswordExpires, password_changed_at, ...userFiltered } = user;
        req.user = userFiltered;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') throw new AuthFailureError('Invalid token');
        if (error.name === 'TokenExpiredError') throw new AuthFailureError('Token expired');
        next(error);
    }
};

const optionalAuth = async (req, res, next) => {
    const token = req.cookies.accessToken;

    if (!token) {
        return next();
    }

    try {
        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // get user
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user) throw new NotFoundError('User not found');
        if (!user.isActive) ForbiddenError('Your account has been locked. Please contact administrator');

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') throw new AuthFailureError('Invalid token');
        if (error.name === 'TokenExpiredError') throw new AuthFailureError('Token expired');
        next(error);
    }
}

module.exports = { authenticate }