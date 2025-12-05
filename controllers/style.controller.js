const { PrismaClient } = require('@prisma/client');
const { generateSlugAndCheckExists } = require('../utils/generateSlug');
const { Created, OK } = require('../utils/core/successResponse');
const { getAllStylesSchema, createStyleSchema, updateStyleSchema } = require('../middlewares/validations/style.validation');
const { ConflictRequestError, NotFoundError } = require('../utils/core/errorResponse');
const prisma = new PrismaClient();

const createStyle = async (req, res, next) => {
    try {
        const { error, value } = createStyleSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { name, description, isActive } = value;

        let style;
        await prisma.$transaction(async (tx) => {
            const existingStyle = await tx.style.findUnique({
                where: { name }
            });
            if (existingStyle) throw new ConflictRequestError('Style name already exists');

            const slug = await generateSlugAndCheckExists(name, async (slug) => {
                return await tx.style.findUnique({ where: { slug } });
            });
            if (!slug) throw new ConflictRequestError('Slug already exists');

            style = await tx.style.create({
                data: {
                    name,
                    slug,
                    description: description || null,
                    isActive
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
        });

        return new Created({
            message: 'Style created successfully',
            data: style
        }).send(res);

    } catch (error) {
        next(error);
    }
};

const getAllStylesAdmin = async (req, res, next) => {
    try {
        const { error, value } = getAllStylesSchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { page, limit, sortBy, sortOrder, search, isActive } = value;
        const skip = (page - 1) * limit;

        const where = {};

        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (isActive !== undefined) where.isActive = isActive;
        const orderBy = { [sortBy]: sortOrder };

        const [styles, totalCount] = await Promise.all([
            prisma.style.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    isActive: true,
                    _count: {
                        select: {
                            styles: {
                                where: {
                                    product: {
                                        isDeleted: false
                                    }
                                }
                            }
                        }
                    },
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.style.count({ where })
        ]);

        const formattedStyles = styles.map(style => ({
            ...style,
            productCount: style._count.styles
        }));
        const totalPages = Math.ceil(totalCount / limit);

        return new OK({
            message: 'Get styles successfully',
            data: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                },
                styles: formattedStyles
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getAllStylesClient = async (req, res, next) => {
    try {
        const styles = await prisma.style.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true
            }
        });

        return new OK({
            message: 'Get styles successfully',
            data: styles
        }).send(res);

    } catch (error) {
        next(error);
    }
};

const getStyleById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const style = await prisma.style.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                isActive: true,
                _count: {
                    select: {
                        styles: {
                            where: {
                                product: {
                                    isDeleted: false
                                }
                            }
                        }
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });
        if (!style) throw new NotFoundError('Style not found');

        const formattedStyle = {
            ...style,
            productCount: style._count.styles
        };

        return new OK({
            message: 'Get style successfully',
            data: formattedStyle
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getStyleBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const style = await prisma.style.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                isActive: true,
                _count: {
                    select: {
                        styles: {
                            where: {
                                product: {
                                    isDeleted: false
                                }
                            }
                        }
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });
        if (!style) throw new NotFoundError('Style not found');

        const formattedStyle = {
            ...style,
            productCount: style._count.styles
        };

        return new OK({
            message: 'Get style successfully',
            data: formattedStyle
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const updateStyle = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { error, value } = updateStyleSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { name, description, isActive } = value;

        let updatedStyle;
        await prisma.$transaction(async (tx) => {
            const style = await tx.style.findFirst({
                where: { id },
                select: { id: true, name: true, slug: true }
            });
            if (!style) throw new NotFoundError('Style not found');

            const updateData = {};

            if (name && name !== style.name) {
                const existingStyle = await tx.style.findUnique({
                    where: { name }
                });
                if (existingStyle) throw new ConflictRequestError('Style name already exists');

                updateData.name = name;

                const slug = await generateSlugAndCheckExists(name, async (slug) => {
                    return await tx.style.findUnique({ where: { slug } });
                });
                if (!slug) throw new ConflictRequestError('Slug already exits');

                updateData.slug = slug;
            }

            if (description !== undefined) updateData.description = description || null;

            if (isActive !== undefined) updateData.isActive = isActive;

            updatedStyle = await tx.style.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    isActive: true,
                    _count: {
                        select: {
                            styles: {
                                where: {
                                    product: {
                                        isDeleted: false
                                    }
                                }
                            }
                        }
                    },
                    createdAt: true,
                    updatedAt: true
                }
            });
        });

        const formattedStyle = {
            ...updatedStyle,
            productCount: updatedStyle._count.styles
        };

        return new OK({
            message: 'Style updated successfully',
            data: formattedStyle
        }).send(res);

    } catch (error) {
        next(error);
    }
};

const deleteStyle = async (req, res, next) => {
    try {
        const { id } = req.params;

        const style = await prisma.style.findUnique({
            where: { id },
            select: {
                id: true,
                _count: {
                    select: {
                        styles: {
                            where: {
                                product: {
                                    isDeleted: false
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!style) throw new NotFoundError('Style not found');

        if (style._count.styles > 0) {
            throw new BadRequestError(
                `Cannot delete style. It is being used by ${style._count.styles} product(s)`
            );
        }

        await prisma.style.delete({
            where: { id }
        });

        return new OK({
            message: 'Style deleted successfully'
        }).send(res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createStyle,
    getAllStylesAdmin,
    getAllStylesClient,
    getStyleById,
    getStyleBySlug,
    updateStyle,
    deleteStyle
};