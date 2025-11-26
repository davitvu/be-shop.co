const { PrismaClient } = require('@prisma/client');
const { createColorSchema, getAllColorsSchema, updateColorSchema } = require('../middlewares/validations/color.validation');
const { BadRequestError, ConflictRequestError, NotFoundError } = require('../utils/core/errorResponse');
const { Created, OK } = require('../utils/core/successResponse');
const prisma = new PrismaClient();

const createColor = async (req, res, next) => {
    try {
        const { error, value } = createColorSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        })
        if (error) {
            const errorMessages = error.details.map(d => d.message).join(', ');
            throw new BadRequestError(errorMessages)
        }

        const { name, hex, isActive } = value;

        const existingColor = await prisma.color.findUnique({
            where: { name }
        });
        if (existingColor) throw new ConflictRequestError('Color name already exists');

        const color = await prisma.color.create({
            data: { name, hex, isActive },
            select: {
                id: true,
                name: true,
                hex: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return new Created({
            message: "Color created successfully",
            metadata: color
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getAllColorsAdmin = async (req, res, next) => {
    try {
        const { error, value } = getAllColorsSchema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(d => d.message).join(', ');
            throw new BadRequestError(errorMessages)
        };

        const {
            page, limit, sortBy, sortOrder,
            search, isActive
        } = value;

        const skip = (page - 1) * limit;
        const orderBy = { [sortBy]: sortOrder };

        const where = {};

        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { hex: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (isActive !== undefined) where.isActive = isActive;

        const [colors, totalCount] = await Promise.all([
            prisma.color.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    hex: true,
                    _count: {
                        select: {
                            variants: {
                                where: { isDeleted: false }
                            }
                        }
                    },
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.color.count({ where })
        ]);

        const formattedColors = colors.map(color => ({
            ...colors,
            variantCount: color._count.variants
        }));
        const totalPages = Math.ceil(totalCount / limit);

        return new OK({
            message: 'Get colors successfully',
            metadata: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                },
                colors: formattedColors,
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getAllColorsClient = async (req, res, next) => {
    try {
        const colors = await prisma.color.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                hex: true,
            }
        });

        return new OK({
            message: "Get colors successfully",
            metadata: colors
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getColorById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const color = await prisma.color.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                hex: true,
                isActive: true,
                _count: {
                    select: {
                        variants: {
                            where: { isDeleted: false }
                        }
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });
        if (!color) throw new NotFoundError("Color not found");

        const formattedColor = {
            ...color,
            variantCount: color._count.variants
        };

        return new OK({
            message: 'Get color successfully',
            metadata: formattedColor
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const updateColor = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { error, value } = updateColorSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(d => d.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { name } = value;

        const color = await prisma.color.findUnique({
            where: { id }
        });
        if (!color) throw new NotFoundError('Color not found');;

        if (name && name !== color.name) {
            const existingColor = await prisma.color.findUnique({
                where: { name }
            })
            if (existingColor) throw new ConflictRequestError('Color name already exists');
        }

        const updatedColor = await prisma.color.update({
            where: { id },
            data: value,
            select: {
                id: true,
                name: true,
                hex: true,
                isActive: true,
                _count: {
                    select: {
                        variants: {
                            where: { isDeleted: false }
                        }
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });

        const formattedColor = {
            ...updatedColor,
            variantCount: updatedColor._count.productVariants
        };

        return new OK({
            message: 'Color updated successfully',
            metadata: formattedColor
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const deleteColor = async (req, res, next) => {
    try {
        const { id } = req.params;

        const color = await prisma.color.findUnique({
            where: { id },
            select: {
                id: true,
                _count: {
                    select: {
                        variants: {
                            where: { isDeleted: false }
                        }
                    }
                }
            }
        });
        if (!color) throw new NotFoundError('Color not found');

        if (color._count.variants > 0) {
            throw new BadRequestError(
                `Cannot delete color. It is being used by ${color._count.variants} variant(s)`
            );
        }

        await prisma.color.delete({
            where: { id }
        })

        return new OK({
            message: 'Color deleted successfully'
        }).send(res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createColor,
    getAllColorsAdmin,
    getAllColorsClient,
    getColorById,
    updateColor,
    deleteColor
}