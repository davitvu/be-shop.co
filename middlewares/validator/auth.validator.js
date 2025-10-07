const Joi = require("joi");

const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least {#limit} characters',
        'string.empty': 'Password is required',
        'any.required': 'Password is required',
    }),
    firstName: Joi.string().required().messages({
        'string.empty': 'First name is required',
        'any.required': 'First name is required',
    }),
    lastName: Joi.string().required().messages({
        'string.empty': 'Last name is required',
        'any.required': 'Last name is required',
    }),
    phone: Joi.string().required().trim()
        .replace(/[\s.-]/g, '')     // bỏ khoảng trắng, -, .
        .replace(/^\+84/, '0')      // +84 → 0
        .pattern(/^0[35789]\d{8}$/, 'VN mobile number') // 03/05/07/08/09 + 8 số
        .messages({
            'string.empty': 'Phone is required',
            'string.pattern.base': 'Invalid phone number',
        }),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least {#limit} characters',
        'string.empty': 'Password is required',
        'any.required': 'Password is required',
    }),
});

module.exports = {
    registerSchema,
    loginSchema
};