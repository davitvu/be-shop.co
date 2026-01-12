const Joi = require('joi');

const getDashboardOverviewSchema = Joi.object({
    period: Joi.string().valid('today', 'week', 'month', 'year').default('month').messages({
        'any.only': 'Period must be today, week, month, or year'
    })
});

const getRevenueStatsSchema = Joi.object({
    startDate: Joi.date().iso().required().messages({
        'date.base': 'Start date must be a valid date',
        'any.required': 'Start date is required'
    }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
        'date.base': 'End date must be a valid date',
        'date.min': 'End date must be after start date',
        'any.required': 'End date is required'
    }),
    groupBy: Joi.string().valid('day', 'week', 'month').default('day').messages({
        'any.only': 'Group by must be day, week, or month'
    })
});

module.exports = {
    getDashboardOverviewSchema,
    getRevenueStatsSchema
};