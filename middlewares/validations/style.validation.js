const Joi = require('joi');

const createStyleSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required().messages({
        'string.empty': 'Style name is required',
        'string.min': 'Style name must be at least 2 characters',
        'string.max': 'Style name must not exceed 50 characters'
    }),
    description: Joi.string().trim().max(500).allow('', null).optional().messages({
        'string.max': 'Description must not exceed 500 characters'
    }),
    isActive: Joi.boolean().default(true)
});

const updateStyleSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).optional().messages({
        'string.min': 'Style name must be at least 2 characters',
        'string.max': 'Style name must not exceed 50 characters'
    }),
    description: Joi.string().trim().max(500).allow('', null).optional().messages({
        'string.max': 'Description must not exceed 500 characters'
    }),
    isActive: Joi.boolean().optional()
}).min(1).messages({
    'object.min': 'At least one field is required to update'
});

const getAllStylesSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('name', 'createdAt', 'isActive').default('name'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    search: Joi.string().trim().allow('').optional(),
    isActive: Joi.boolean().optional()
});

module.exports = {
    createStyleSchema,
    updateStyleSchema,
    getAllStylesSchema
};