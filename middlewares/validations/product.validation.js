const Joi = require("joi");

const createProductSchema = Joi.object({
    name: Joi.string().trim().min(2).max(200).required().messages({
        'string.empty': 'Product name is required',
        'string.min': 'Product name must be at least 2 characters',
        'string.max': 'Product name must not exceed 200 characters'
    }),
    description: Joi.string().trim().max(5000).allow('', null).optional().messages({
        'string.max': 'Description must not exceed 5000 characters'
    }),
    price: Joi.number().positive().precision(2).required().messages({
        'number.base': 'Price must be a number',
        'number.positive': 'Price must be greater than 0',
        'any.required': 'Price is required'
    }),
    stock: Joi.number().integer().min(0).default(0).messages({
        'number.base': 'Stock must be a number',
        'number.integer': 'Stock must be an integer',
        'number.min': 'Stock cannot be negative'
    }),
    categoryId: Joi.string().uuid().required().messages({
        'string.empty': 'Category is required',
        'string.guid': 'Invalid category ID format'
    }),
    styleIds: Joi.array().items(Joi.string()).min(1).optional().messages({
        'array.min': 'At least one style must be selected if provided',
        'string.guid': 'Invalid style ID format'
    }),
    isPublished: Joi.boolean().default(false)
});

const getAllProductsAdminSchema = Joi.object({
    // pagination
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),

    // sorting
    sortBy: Joi.string().valid('name', 'price', 'stock', 'isPublished', 'isDeleted', 'createdAt', 'updatedAt', 'deletedAt').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),

    // filtering
    search: Joi.string().trim().allow('').optional(), // id, name
    category: Joi.string().optional(),
    isPublished: Joi.boolean().optional(),
    isDeleted: Joi.boolean().optional(),
    stock: Joi.boolean().optional(), // true = chỉ lấy sp còn hàng
    styles: Joi.string().optional(),

    // range filters
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    minStock: Joi.number().integer().min(0).optional(),
    maxStock: Joi.number().integer().min(0).optional(),

    // date filters
    createdFrom: Joi.date().iso().optional(),
    createdTo: Joi.date().iso().optional(),
    updatedFrom: Joi.date().iso().optional(),
    updatedTo: Joi.date().iso().optional(),
    deletedFrom: Joi.date().iso().optional(),
    deletedTo: Joi.date().iso().optional(),
}).custom((value, helpers) => {
    // validate price range
    if (value.minPrice !== undefined && value.maxPrice !== undefined) {
        if (value.minPrice > value.maxPrice) {
            return helpers.error('custom.priceRange');
        }
    }

    // validate stock range
    if (value.minStock !== undefined && value.maxStock !== undefined) {
        if (value.minStock > value.maxStock) {
            return helpers.error('custom.stockRange');
        }
    }

    // validate created range
    if (value.createdFrom && value.createdTo) {
        if (new Date(value.createdFrom) > new Date(value.createdTo)) {
            return helpers.error('custom.createdRange');
        }
    }

    // validate updated range
    if (value.updatedFrom && value.updatedTo) {
        if (new Date(value.updatedFrom) > new Date(value.updatedTo)) {
            return helpers.error('custom.updatedRange');
        }
    }

    // validate deleted range
    if (value.deletedFrom && value.deletedTo) {
        if (new Date(value.deletedFrom) > new Date(value.deletedTo)) {
            return helpers.error('custom.deletedRange');
        }
    }

    return value;
}, 'Custom validation').messages({
    'custom.priceRange': 'minPrice must be less than or equal to maxPrice',
    'custom.stockRange': 'minStock must be less than or equal to maxStock',
    'custom.createdRange': 'createdFrom must be before createdTo',
    'custom.updatedRange': 'updatedFrom must be before updatedTo',
    'custom.deletedRange': 'deletedFrom must be before deletedTo',
});

const getAllProductsClientSchema = Joi.object({
    // pagination
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(12),

    // sorting
    sortBy: Joi.string().valid('name', 'price', 'createdAt', 'popular').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),

    // filtering
    search: Joi.string().trim().allow('').optional(),
    category: Joi.string().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    styles: Joi.string().optional()
}).custom((value, helpers) => {
    // Validate price range
    if (value.minPrice !== undefined && value.maxPrice !== undefined) {
        if (value.minPrice > value.maxPrice) {
            return helpers.error('custom.priceRange');
        }
    }
    return value;
}, 'Custom validation').messages({
    'custom.priceRange': 'minPrice must be less than or equal to maxPrice'
});

const updateProductSchema = Joi.object({
    name: Joi.string().trim().min(2).max(200).optional()
        .messages({
            'string.min': 'Product name must be at least 2 characters',
            'string.max': 'Product name must not exceed 200 characters'
        }),
    description: Joi.string().trim().max(5000).allow('', null).optional()
        .messages({
            'string.max': 'Description must not exceed 5000 characters'
        }),
    price: Joi.number().positive().precision(2).optional()
        .messages({
            'number.positive': 'Price must be greater than 0'
        }),
    stock: Joi.number().integer().min(0).optional()
        .messages({
            'number.integer': 'Stock must be an integer',
            'number.min': 'Stock cannot be negative'
        }),
    categoryId: Joi.string().uuid().optional()
        .messages({
            'string.guid': 'Invalid category ID format'
        }),
    styleIds: Joi.array().items(Joi.string().uuid()).optional()
        .messages({
            'string.guid': 'Invalid style ID format'
        }),
    isPublished: Joi.boolean().optional()
});

// Image
const uploadProductImagesSchema = Joi.object({
    productId: Joi.string().uuid().required()
        .messages({
            'string.empty': 'Product ID is required',
            'string.guid': 'Invalid product ID format'
        }),
    variantId: Joi.string().uuid().allow(null).optional()
        .messages({
            'string.guid': 'Invalid variant ID format'
        }),
    alts: Joi.array().items(Joi.string().max(200)).optional(),
    isMain: Joi.boolean().default(false)
});

const updateProductImageSchema = Joi.object({
    alt: Joi.string().max(200).optional(),
    isMain: Joi.boolean().optional(),
    sortOrder: Joi.number().integer().min(0).optional()
}).min(1);

module.exports = {
    getAllProductsAdminSchema,
    createProductSchema,
    uploadProductImagesSchema,
    updateProductImageSchema,
    updateProductSchema,
    getAllProductsClientSchema
};
