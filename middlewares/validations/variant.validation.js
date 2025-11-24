const Joi = require('joi');

const createVariantSchema = Joi.object({
    productId: Joi.string().required().messages({
        'string.empty': 'Product ID is required',
    }),
    colorId: Joi.string().optional().allow(null, ''),
    sizeId: Joi.string().optional().allow(null, ''),
    // SKU,
    price: Joi.number().positive().precision(2).required()
        .messages({
            'number.positive': 'Price must be greater than 0',
            'any.required': 'Price is required'
        }),
    stock: Joi.number().integer().min(0).default(0)
        .messages({
            'number.integer': 'Stock must be an integer',
            'number.min': 'Stock cannot be negative'
        }),
    isPublished: Joi.boolean().default(false)
}).custom((value, helpers) => {
    if (!value.colorId) value.colorId = undefined;
    if (!value.sizeId) value.sizeId = undefined;

    if (!value.colorId && !value.sizeId) {
        return helpers.error('custom.noOptions');
    }

    return value;
}, 'color/size validation').messages({
    'custom.noOptions': 'At least one of colorId or sizeId is required'
});

const getAllVariantsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('price', 'stock', 'createdAt', 'isDeleted', 'deletedAt', 'isPublished').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    colorId: Joi.string().uuid().optional(),
    sizeId: Joi.string().uuid().optional(),
    isPublished: Joi.boolean().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    minStock: Joi.number().integer().min(0).optional(),
    maxStock: Joi.number().integer().min(0).optional(),
    deletedFrom: Joi.date().iso().optional(),
    deleteTo: Joi.date().iso().optional(),
}).custom((value, helpers) => {
    if (value.minPrice !== undefined && value.maxPrice !== undefined) {
        if (value.minPrice > value.maxPrice) {
            return helpers.error('custom.priceRange');
        }
    }
    if (value.minStock !== undefined && value.maxStock !== undefined) {
        if (value.minStock > value.maxStock) {
            return helpers.error('custom.stockRange');
        }
    }
    if (value.deletedFrom && value.deletedTo) {
        if (new Date(value.deletedFrom) > new Date(value.deletedTo)) {
            return helpers.error('custom.deletedRange');
        }
    }
    return value;
}, 'Custom validation').messages({
    'custom.priceRange': 'minPrice must be less than or equal to maxPrice',
    'custom.stockRange': 'minStock must be less than or equal to maxStock',
    'custom.deletedRange': 'deletedFrom must be before deletedTo',
});

const updateVariantSchema = Joi.object({
    colorId: Joi.string().allow(null).optional(),
    sizeId: Joi.string().allow(null).optional(),
    price: Joi.number().positive().precision(2).optional()
        .messages({
            'number.positive': 'Price must be greater than 0'
        }),
    stock: Joi.number().integer().min(0).optional()
        .messages({
            'number.integer': 'Stock must be an integer',
            'number.min': 'Stock cannot be negative'
        }),
    isPublished: Joi.boolean().optional()
});

module.exports = {
    createVariantSchema,
    getAllVariantsSchema,
    updateVariantSchema
}