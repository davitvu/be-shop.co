const Joi = require("joi");

const createAddressSchema = Joi.object({
    nameReminiscent: Joi.string().min(1).max(50).required().messages({
        'string.empty': 'Name reminiscent is required',
        'string.min': 'Name reminiscent must be at least 2 characters',
        'string.max': 'Name reminiscent must not exceed 100 characters'
    }),
    firstName: Joi.string().min(2).max(50).required().messages({
        'string.empty': 'First name is required',
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name must not exceed 100 characters'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
        'string.empty': 'Last name is required',
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name must not exceed 100 characters'
    }),
    phone: Joi.string().pattern(/^(0|\+?\d{1,3})\d{9,10}$/).required().messages({
        "any.required": "Phone number is required",
        "string.pattern.base": "Phone number is invalid",
    }),
    address: Joi.string().min(2).max(200).required().messages({
        'string.empty': 'Address is required',
        'string.min': 'Address must be at least 5 characters',
        'string.max': 'Address must not exceed 200 characters'
    }),
    ward: Joi.string().trim().min(2).max(100).required()
        .messages({
            'string.empty': 'Ward is required',
            'string.min': 'Ward must be at least 2 characters',
            'string.max': 'Ward must not exceed 100 characters'
        }),
    district: Joi.string().trim().min(2).max(100).required()
        .messages({
            'string.empty': 'District is required',
            'string.min': 'District must be at least 2 characters',
            'string.max': 'District must not exceed 100 characters'
        }),
    city: Joi.string().trim().min(2).max(100).required()
        .messages({
            'string.empty': 'City is required',
            'string.min': 'City must be at least 2 characters',
            'string.max': 'City must not exceed 100 characters'
        }),

    addressType: Joi.string().valid("HOME", "OFFICE").required().messages({
        "any.only": "Address type must be HOME or OFFICE",
        "any.required": "Address type is required",
    }),
    isDefault: Joi.boolean().truthy('true').falsy('false').required()
});

const updateAddressSchema = Joi.object({
    nameReminiscent: Joi.string().trim().min(2).max(100).optional().messages({
        'string.min': 'Full name must be at least 2 characters',
        'string.max': 'Full name must not exceed 100 characters'
    }),
    firstName: Joi.string().trim().min(2).max(100).optional().messages({
        'string.min': 'Full name must be at least 2 characters',
        'string.max': 'Full name must not exceed 100 characters'
    }),
    lastName: Joi.string().trim().min(2).max(100).optional().messages({
        'string.min': 'Full name must be at least 2 characters',
        'string.max': 'Full name must not exceed 100 characters'
    }),
    phone: Joi.string().trim().pattern(/^(0|\+?\d{1,3})\d{9,10}$/).optional().messages({
        "string.pattern.base": "Phone number is invalid",
    }),
    address: Joi.string().trim().min(5).max(200).optional().messages({
        'string.min': 'Address must be at least 5 characters',
        'string.max': 'Address must not exceed 200 characters'
    }),
    ward: Joi.string().trim().min(2).max(100).optional().messages({
        'string.min': 'Ward must be at least 2 characters',
        'string.max': 'Ward must not exceed 100 characters'
    }),
    district: Joi.string().trim().min(2).max(100).optional().messages({
        'string.min': 'District must be at least 2 characters',
        'string.max': 'District must not exceed 100 characters'
    }),
    city: Joi.string().trim().min(2).max(100).optional().messages({
        'string.min': 'City must be at least 2 characters',
        'string.max': 'City must not exceed 100 characters'
    }),
    addressType: Joi.string().valid("HOME", "OFFICE").optional().messages({
        "any.only": "Address type must be HOME or OFFICE",
    }),
    isDefault: Joi.boolean().truthy('true').falsy('false').optional()
});

module.exports = {
    createAddressSchema,
    updateAddressSchema
}