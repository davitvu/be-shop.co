const Joi = require('joi');

const createReviewSchema = Joi.object({
    productId: Joi.string().required().messages({
            'string.empty': 'Product ID is required',
        }),
    orderId: Joi.string().required().messages({
            'string.empty': 'Order ID is required',
        }),
    rating: Joi.number().integer().min(1).max(5).required().messages({
            'number.base': 'Rating must be a number',
            'number.integer': 'Rating must be an integer',
            'number.min': 'Rating must be at least 1',
            'number.max': 'Rating must not exceed 5',
            'any.required': 'Rating is required'
        }),
    comment: Joi.string().trim().min(10).max(1000).required().messages({
            'string.empty': 'Comment is required',
            'string.min': 'Comment must be at least 10 characters',
            'string.max': 'Comment must not exceed 1000 characters'
        })
});

const getReviewsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    sortBy: Joi.string().valid('createdAt', 'rating').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    rating: Joi.number().integer().min(1).max(5).optional()
});

const updateReviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional().messages({
            'number.base': 'Rating must be a number',
            'number.integer': 'Rating must be an integer',
            'number.min': 'Rating must be at least 1',
            'number.max': 'Rating must not exceed 5'
        }),
    comment: Joi.string().trim().min(10).max(1000).optional().messages({
            'string.min': 'Comment must be at least 10 characters',
            'string.max': 'Comment must not exceed 1000 characters'
        })
}).min(1).messages({
    'object.min': 'At least one field is required to update'
});

module.exports = {
    createReviewSchema,
    getReviewsSchema,
    updateReviewSchema
}