const Joi = require("joi");

const updateProfileSchema = Joi.object({
    userId: Joi.string().required().trim().message({
        'string.empty': 'userId is required',
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required',
    }),
    firstName: Joi.string().trim().optional().messages({
        'string.empty': 'First name must not be empty',
    }),
    lastName: Joi.string().trim().optional().messages({
        'string.empty': 'Last name must not be empty',
    }),
    phone: Joi.string().optional().trim()
        .replace(/[\s.-]/g, '')     // bỏ khoảng trắng, -, .
        .replace(/^\+84/, '0')      // +84 → 0
        .pattern(/^0[35789]\d{8}$/, 'VN mobile number') // 03/05/07/08/09 + 8 số
        .messages({
            'string.empty': 'Phone is required',
            'string.pattern.base': 'Invalid phone number',
        }),
});

const updatePasswordSchema = Joi.object({
    currentPassword: Joi.string().required().messages({
        'string.empty': 'Current password is required',
        'any.required': 'Current password is required',
    }),
    newPassword: Joi.string().min(6).required().messages({
        'string.min': 'New password must be at least {#limit} characters',
        'string.max': 'New password must not exceed {#limit} characters',
        'string.empty': 'New password is required',
        'any.required': 'New password is required',
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
        'any.only': 'Confirm password does not match new password',
        'string.empty': 'Confirm password is required',
        'any.required': 'Confirm password is required',
    }),
});

/** Admin updater user */
const adminUpdateUserSchema = Joi.object({
    firstName: Joi.string().trim().optional(),
    lastName: Joi.string().trim().optional(),
    phone: Joi.string().optional().trim()
        .replace(/[\s.-]/g, '')     // bỏ khoảng trắng, -, .
        .replace(/^\+84/, '0')      // +84 → 0
        .pattern(/^0[35789]\d{8}$/, 'VN mobile number') // 03/05/07/08/09 + 8 số
        .messages({
            'string.empty': 'Phone is required',
            'string.pattern.base': 'Invalid phone number',
        }),
    role: Joi.string().valid('user', 'admin', 'manager').optional().messages({
        'any.only': 'Role must be one of: user, admin, manager',
    }),
    isActive: Joi.boolean().optional(),
    isEmailVerified: Joi.boolean().optional(),
});



module.exports = {
    updateProfileSchema,
    updatePasswordSchema
};