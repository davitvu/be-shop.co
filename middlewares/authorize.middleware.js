const createError = require('http-errors');

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) return next(createError(401, 'Login to continue'));
        if (!roles.includes(req.user.role)) return next(createError(403, `You do not have permission to access this resource (${roles.join('/')})`));

        next();
    }
}

module.exports = { authorize };