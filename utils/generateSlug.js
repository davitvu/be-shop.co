const slugify = require('slugify');

const generateSlugAndCheckExists = async (input, checkExists, options = {}) => {
    if (!input) return null;

    const slug = slugify(input, {
        lower: true,
        strict: true,
        locale: 'vi',
        replacement: '-',
        ...options
    });

    const exists = !!(await checkExists(slug));

    return exists ? null : slug;
};

module.exports = { generateSlugAndCheckExists }