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

const getAllUserOrderSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    status: Joi.string().uppercase().valid('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED').optional(),
    paymentStatus: Joi.string().uppercase().valid('PENDING', 'PAID', 'FAILED', 'REFUNDED').optional()
});

const cancelOrderSchema = Joi.object({
    reason: Joi.string().trim().min(10).max(500).required()
        .messages({
            'string.empty': 'Cancellation reason is required',
            'string.min': 'Reason must be at least 10 characters',
            'string.max': 'Reason must not exceed 500 characters'
        })
});

const getAllOrdersAdminSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'total', 'total').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    status: Joi.string().valid('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED').optional(),
    paymentStatus: Joi.string().valid('PENDING', 'PAID', 'FAILED', 'REFUNDED').optional(),
    paymentMethod: Joi.string().valid('COD', 'VNPAY', 'MOMO', 'STRIPE', 'PAYPAL').optional(),
    search: Joi.string().trim().allow('').optional(), // search by id, order number, customer name, phone
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional()
}).custom((value, helpers) => {
    if (value.dateTo && value.dateFrom && value.dateTo < value.dateFrom) {
        return helpers.error('custom.dateRange');
    }
    return value;
}, 'Custom validation').messages({
    'custom.dateRange': 'dateTo must be after dateFrom'
});

const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED').required()
        .messages({
            'string.empty': 'Status is required',
            'any.only': 'Invalid status'
        }),
    adminNotes: Joi.string().trim().max(1000).allow('', null).optional()
        .messages({
            'string.max': 'Admin notes must not exceed 1000 characters'
        })
});

module.exports = {
    createOrderSchema,
    getAllUserOrderSchema,
    cancelOrderSchema,
    getAllOrdersAdminSchema,
    updateOrderStatusSchema
}