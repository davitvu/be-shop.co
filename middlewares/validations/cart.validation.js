const Joi = require('joi');

const addToCartSchema = Joi.object({
    variantId: Joi.string().required().messages({
        'string.empty': 'Variant ID is required',
        'string.guid': 'Invalid must be at least 1'
    }),
    quantity: Joi.number().integer().min(1).default(1).messages({
        'number.integer': 'Quantity must be an integer',
        'number.min': "Quantity must be at least 1"
    }),
});

const updateCartItemSchema = Joi.object({
    quantity: Joi.number().integer().min(1).required().messages({
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
        'any.required': 'Quantity is required'
    })
});

module.exports = {
    addToCartSchema,
    updateCartItemSchema
}; 