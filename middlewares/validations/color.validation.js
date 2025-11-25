const Joi = require('joi');

const createColorSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required().messages({
        'string.empty': 'Color name is required',
        'string.min': 'Color name must be at least 2 characters',
        'string.max': 'Color name must not exceed 50 characters'
    }),
    hex: Joi.string().trim().pattern(/^#[0-9A-Fa-f]{6}$/).required().messages({
        'string.empty': 'Hex code is required',
        'string.pattern.base': 'Invalid hex code format. Must be like #FF0000'
    }),
    isActive: Joi.boolean().default(true)
});

const updateColorSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).optional().messages({
        'string.min': 'Color name must be at least 2 characters',
        'string.max': 'Color name must not exceed 50 characters'
    }),
    hex: Joi.string().trim().pattern(/^#[0-9A-Fa-f]{6}$/).optional().messages({
        'string.pattern.base': 'Invalid hex code format. Must be like #FF0000'
    }),
    isActive: Joi.boolean().optional()
}).min(1).messages({
    'object.min': 'At least one field is required to update'
});

const getAllColorsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),
    sortBy: Joi.string().valid('name', 'createAt', 'isActive').default('name'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    search: Joi.string().trim().allow('').optional(),
    isActive: Joi.boolean().optional(),
});

module.exports = {
    createColorSchema,
    updateColorSchema,
    getAllColorsSchema
}