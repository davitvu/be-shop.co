const Joi = require('joi');

const createSizeSchema = Joi.object({
    name: Joi.string().trim().min(1).max(50).required().messages({
        'string.empty': 'Size name is required',
        'string.min': 'Size name must be at least 1 character',
        'string.max': 'Size name must not exceed 50 characters'
    }),
    value: Joi.string().trim().min(1).max(50).required().messages({
        'string.empty': 'Size name is required',
        'string.min': 'Size name must be at least 1 character',
        'string.max': 'Size name must not exceed 50 characters'
    }),
    isActive: Joi.boolean().default(true)
});

const updateSizeSchema = Joi.object({
    name: Joi.string().trim().min(1).max(50).optional()
        .messages({
            'string.min': 'Size name must be at least 1 character',
            'string.max': 'Size name must not exceed 50 characters'
        }),
    value: Joi.string().trim().min(1).max(50).optional()
        .messages({
            'string.min': 'Size value must be at least 1 character',
            'string.max': 'Size value must not exceed 50 characters'
        }),
    isActive: Joi.boolean().optional()
}).min(1).messages({
    'object.min': 'At least one field is required to update'
});

const getAllSizesSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),
    sortBy: Joi.string().valid('name', 'createdAt', 'isActive').default('name'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    search: Joi.string().trim().allow('').optional,
    isActive: Joi.boolean().optional()
});

module.exports = {
    createSizeSchema,
    updateSizeSchema,
    getAllSizesSchema
}