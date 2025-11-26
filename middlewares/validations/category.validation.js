const Joi = require("joi");

const createCategorySchema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
        'string.empty': 'Category name is required',
        'string.min': 'Category name must be at least 2 characters',
        'string.max': 'Category name must not exceed 100 characters'
    }),
    slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required().messages({
        'string.empty': 'Slug is required',
        'string.pattern.base': 'Slug must be lowercase and use hyphens (e.g., electronics-devices)'
    }),
    description: Joi.string().trim().allow('', null).optional(),
    isPublished: Joi.boolean().optional().default(true),
});

const updateCategorySchema = Joi.object({
    id: Joi.string().required().messages({
        'string.empty': 'Category Id is required',
    }),
    name: Joi.string().min(2).max(100).optional().messages({
        'string.empty': 'Category name is required',
        'string.min': 'Category name must be at least 2 characters',
        'string.max': 'Category name must not exceed 100 characters'
    }),
    slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().messages({
        'string.empty': 'Slug is required',
        'string.pattern.base': 'Slug must be lowercase and use hyphens (e.g., electronics-devices)'
    }),
    description: Joi.string().trim().max(1000).allow('', null).optional(),
    isPublished: Joi.boolean().optional(),
});

const getAllCategoriesSchema = Joi.object({
    // pagination
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),

    // sorting
    sortBy: Joi.string().valid('name', 'createdAt', 'updatedAt', 'isPublished', 'isDeleted').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),

    // fil
    search: Joi.string().trim().allow('').optional(), // search by id, name, slug
    isPublished: Joi.boolean().optional(),
    isDeleted: Joi.boolean().optional(),
    includeProducts: Joi.boolean().optional().default(false), // Include products in response

    // Date range filters
    createdFrom: Joi.date().iso().optional(),
    createdTo: Joi.date().iso().optional(),
    updatedFrom: Joi.date().iso().optional(),
    updatedTo: Joi.date().iso().optional(),
    deletedFrom: Joi.date().iso().optional(),
    deletedTo: Joi.date().iso().optional(),
});

module.exports = {
    createCategorySchema,
    getAllCategoriesSchema,
    updateCategorySchema,
}