const Joi = require('joi');

const createCouponSchema = Joi.object({
    code: Joi.string().trim().uppercase().min(3).max(20).required().messages({
            'string.empty': 'Coupon code is required',
            'string.min': 'Coupon code must be at least 3 characters',
            'string.max': 'Coupon code must not exceed 20 characters'
        }),
    name: Joi.string().trim().min(3).max(100).required().messages({
            'string.empty': 'Coupon name is required',
            'string.min': 'Name must be at least 3 characters',
            'string.max': 'Name must not exceed 100 characters'
        }),
    description: Joi.string().trim().max(500).allow('', null).optional().messages({
            'string.max': 'Description must not exceed 500 characters'
        }),
    type: Joi.string().valid('PERCENT', 'AMOUNT', 'FREE_SHIPPING').required().messages({
            'any.only': 'Type must be PERCENT, AMOUNT, or FREE_SHIPPING'
        }),
    value: Joi.number().integer().min(0).required().messages({
            'number.base': 'Value must be a number',
            'number.min': 'Value must be at least 0'
        }),
    minOrderAmount: Joi.number().integer().min(0).allow(null).optional().messages({
            'number.min': 'Min order amount must be at least 0'
        }),
    maxDiscount: Joi.number().integer().min(0).allow(null).optional().messages({
            'number.min': 'Max discount must be at least 0'
        }),
    usageLimit: Joi.number().integer().min(1).allow(null).optional().messages({
            'number.min': 'Usage limit must be at least 1'
        }),
    perUserLimit: Joi.number().integer().min(1).allow(null).optional().messages({
            'number.min': 'Per user limit must be at least 1'
        }),
    startDate: Joi.date().iso().required().messages({
            'date.base': 'Start date must be a valid date'
        }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
            'date.base': 'End date must be a valid date',
            'date.min': 'End date must be after start date'
        })
}).custom((value, helpers) => {
    // Validation for PERCENT type
    if (value.type === 'PERCENT') {
        if (value.value > 100) {
            return helpers.error('custom.percentMax');
        }
        if (value.value <= 0) {
            return helpers.error('custom.percentMin');
        }
    }
    
    // Validation for FREE_SHIPPING type
    if (value.type === 'FREE_SHIPPING') {
        if (value.value !== 0) {
            return helpers.error('custom.freeShippingValue');
        }
    }

    // Validate endDate after startDate if both provided
    if (value.startDate && value.endDate) {
        if (new Date(value.endDate) <= new Date(value.startDate)) {
            return helpers.error('custom.endDateAfterStart');
        }
    }
    
    return value;
}).messages({
    'custom.percentMax': 'Percent value must not exceed 100',
    'custom.percentMin': 'Percent value must be greater than 0',
    'custom.freeShippingValue': 'Free shipping value must be 0',
    'custom.endDateAfterStart': 'End date must be after start date'
});

const getAllCouponsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('createdAt', 'code', 'usageCount', 'startDate', 'endDate').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    type: Joi.string().valid('PERCENT', 'AMOUNT', 'FREE_SHIPPING').optional(),
    isActive: Joi.boolean().optional(),
    search: Joi.string().trim().allow('').optional() // search by code or name
});

const updateCouponSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100).optional().messages({
            'string.min': 'Name must be at least 3 characters',
            'string.max': 'Name must not exceed 100 characters'
        }),
    description: Joi.string().trim().max(500).allow('', null).optional().messages({
            'string.max': 'Description must not exceed 500 characters'
        }),
    type: Joi.string().valid('PERCENT', 'AMOUNT', 'FREE_SHIPPING').optional().messages({
            'any.only': 'Type must be PERCENT, AMOUNT, or FREE_SHIPPING'
        }),
    value: Joi.number().integer().min(0).optional().messages({
            'number.base': 'Value must be a number',
            'number.min': 'Value must be at least 0'
        }),
    minOrderAmount: Joi.number().integer().min(0).allow(null).optional().messages({
            'number.min': 'Min order amount must be at least 0'
        }),
    maxDiscount: Joi.number().integer().min(0).allow(null).optional().messages({
            'number.min': 'Max discount must be at least 0'
        }),
    usageLimit: Joi.number().integer().min(1).allow(null).optional().messages({
            'number.min': 'Usage limit must be at least 1'
        }),
    perUserLimit: Joi.number().integer().min(1).allow(null).optional().messages({
            'number.min': 'Per user limit must be at least 1'
        }),
    startDate: Joi.date().iso().optional().messages({
            'date.base': 'Start date must be a valid date'
        }),
    endDate: Joi.date().iso().optional().messages({
            'date.base': 'End date must be a valid date'
        }),
    isActive: Joi.boolean().optional()
}).min(1).messages({
    'object.min': 'At least one field is required to update'
}).custom((value, helpers) => {
    // Validation for PERCENT type
    if (value.type === 'PERCENT' && value.value !== undefined) {
        if (value.value > 100) {
            return helpers.error('custom.percentMax');
        }
        if (value.value <= 0) {
            return helpers.error('custom.percentMin');
        }
    }
    
    // Validation for FREE_SHIPPING type
    if (value.type === 'FREE_SHIPPING' && value.value !== undefined) {
        if (value.value !== 0) {
            return helpers.error('custom.freeShippingValue');
        }
    }
    
    // Validate endDate after startDate if both provided
    if (value.startDate && value.endDate) {
        if (new Date(value.endDate) <= new Date(value.startDate)) {
            return helpers.error('custom.endDateAfterStart');
        }
    }
    
    return value;
}).messages({
    'custom.percentMax': 'Percent value must not exceed 100',
    'custom.percentMin': 'Percent value must be greater than 0',
    'custom.freeShippingValue': 'Free shipping value must be 0',
    'custom.endDateAfterStart': 'End date must be after start date'
});

const validateCouponSchema = Joi.object({
    code: Joi.string().trim().uppercase().required().messages({
            'string.empty': 'Coupon code is required'
        }),
    orderTotal: Joi.number().integer().min(0).required().messages({
            'number.base': 'Order total must be a number',
            'number.min': 'Order total must be at least 0',
            'any.required': 'Order total is required'
        })
});

const getAvailableCouponsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    type: Joi.string().valid('PERCENT', 'AMOUNT', 'FREE_SHIPPING').optional()
});

module.exports = {
    createCouponSchema,
    getAllCouponsSchema,
    updateCouponSchema,
    validateCouponSchema,
    getAvailableCouponsSchema
};