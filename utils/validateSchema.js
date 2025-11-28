const { BadRequestError } = require("./core/errorResponse");

const validate = (schema, data, options = {}) => {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        ...options
    });
    if (error) {
        throw new BadRequestError(
            error.details.map(d => d.message).join(', ')
        );
    }

    return value;
};

module.exports = { validate };