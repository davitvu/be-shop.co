const slugify = require('slugify');

const generateSlugAndCheckExists = async (input, checkExists) => {
    if (!input) return null;

    const slug = slugify(input, {
        lower: true,
        strict: true,
        locale: 'vi',
        trim: true
    });

    const exists = !!(await checkExists(slug));

    return exists ? null : slug;
};

module.exports = { generateSlugAndCheckExists }