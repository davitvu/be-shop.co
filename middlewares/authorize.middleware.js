const { AuthFailureError, ForbiddenError } = require('../utils/core/errorResponse');

/**
 *     ===== How to use =====
 * (..., *authenticate, *authorize("admin/ADMIN" || "manager/MANAGER"),...)
 *  chỉ cần sử dụng 1 trong 2 ADMIN hoặc MANAGER
 */

const authorize = (role) => {
    return (req, res, next) => {
        if (!req.user) throw new AuthFailureError('Login to continue');
        if (!role.toUpperCase().includes(req.user.role)) throw new ForbiddenError(`You do not have permission to access this resource.`);

        next();
    }
}

module.exports = { authorize };