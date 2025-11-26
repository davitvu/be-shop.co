const Joi = require('joi');

const createOrderSchema = Joi.object({
    addressId: Joi.string().required().messages({
        'string.empty': 'Address ID is required',
    }),
    paymentMethod: Joi.string().valid('COD', 'VNPAY', 'MOMO', 'STRIPE', 'PAYPAL').required().messages({
        'string.empty': 'Payment method is required',
        'any.only': 'Invalid payment method'
    }),
    notes: Joi.string().trim().max(500).allow('', null).optional().messages({
        'string.max': 'Notes must not exceed 500 characters'
    })
});

module.exports = {
    createOrderSchema,
}