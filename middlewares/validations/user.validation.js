const Joi = require("joi");

const updateProfileSchema = Joi.object({
    id: Joi.string().required().trim().message({
        'string.empty': 'userId is required',
    }),
    firstName: Joi.string().required().messages({
        'string.empty': 'First name is required',
        'any.required': 'First name is required',
    }),
    lastName: Joi.string().required().messages({
        'string.empty': 'Last name is required',
        'any.required': 'Last name is required',
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
const updateUserByAdminSchema = Joi.object({
    firstName: Joi.string().required().messages({
        'string.empty': 'First name is required',
        'any.required': 'First name is required',
    }),
    lastName: Joi.string().required().messages({
        'string.empty': 'Last name is required',
        'any.required': 'Last name is required',
    }),
    phone: Joi.string().optional().trim()
        .replace(/[\s.-]/g, '')     // bỏ khoảng trắng, -, .
        .replace(/^\+84/, '0')      // +84 → 0
        .pattern(/^0[35789]\d{8}$/, 'VN mobile number'), // 03/05/07/08/09 + 8 số
    role: Joi.string().uppercase().valid('USER', 'ADMIN', 'MANAGER').optional(),
    isActive: Joi.boolean().optional(),
    isDeleted: Joi.boolean().optional(),
});

const getAllUsersSchema = Joi.object({
    // Pagination
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),

    // Sorting
    sortBy: Joi.string().valid(
        'createdAt', 'updatedAt', 'email', 'firstName', 'lastName',
        'role', 'isActive', 'isEmailVerified', 'isDeleted',
        'deletedBy', 'deletedAt'
    ).default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),

    // Filtering
    search: Joi.string().trim().allow('').optional(), // Search in email, firstName, lastName, phone
    role: Joi.string().uppercase().valid('USER', 'ADMIN', 'MANAGER').optional(),
    isActive: Joi.boolean().optional(),
    isEmailVerified: Joi.boolean().optional(),
    isDeleted: Joi.boolean().optional(),
    deletedBy: Joi.string().optional(),  // input: id => lọc user bị xoá bởi admin nào

    // Date range filters
    createdFrom: Joi.date().iso().optional(),
    createdTo: Joi.date().iso().optional(),

    deletedFrom: Joi.date().iso().optional(),  
    deletedTo: Joi.date().iso().optional(),

    // Additional filters
    phone: Joi.string().optional(),
});

module.exports = {
    updateProfileSchema,
    updatePasswordSchema,
    getAllUsersSchema,
    updateUserByAdminSchema
};