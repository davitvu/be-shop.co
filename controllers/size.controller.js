const { PrismaClient } = require('@prisma/client');
const { createSizeSchema, updateSizeSchema, getAllSizesSchema } = require('../middlewares/validations/size.validation');
const { BadRequestError, ConflictRequestError, NotFoundError } = require('../utils/core/errorResponse');
const { Created, OK } = require('../utils/core/successResponse');
const { SIZE_PUBLIC_SELECT } = require('../prisma/constants/size-selects');
const prisma = new PrismaClient();

const createSize = async (req, res, next) => {
    try {
        const { error, value } = createSizeSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(d => d.details).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { name } = value;

        const existingSize = await prisma.size.findUnique({
            where: { name }
        });
        if (existingSize) throw new ConflictRequestError('Size name already exists');

        const size = await prisma.size.create({
            data: value,
            select: {
                id: true,
                name: true,
                value: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return new Created({
            message: "Size created successfully",
            metadata: size
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getAllSizesAdmin = async (req, res, next) => {
    try {
        const { error, value } = getAllSizesSchema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(d => d.details).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const {
            limit, page, sortBy, sortOrder,
            search, isActive
        } = value;

        const skip = (page - 1) * limit;
        const orderBy = { [sortBy]: sortOrder };

        const where = {};

        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { value: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (isActive !== undefined) where.isActive = isActive;

        const [sizes, totalCount] = await Promise.all([
            prisma.size.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    value: true,
                    isActive: true,
                    _count: {
                        select: {
                            variants: {
                                where: { isDeleted: false }
                            }
                        }
                    }
                }
            }),
            prisma.size.count({ where })
        ]);

        const formattedSizes = sizes.map(size => ({
            ...size,
            variantCount: size._count.variants
        }));
        const totalPages = Math.ceil(totalCount / limit);

        return new OK({
            message: 'Get sizes successfully',
            metadata: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                },
                sizes: formattedSizes
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getAllSizesClient = async (req, res, next) => {
    try {
        const sizes = await prisma.size.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                value: true
            }
        });

        return new OK({
            message: 'Get sizes successfully',
            metadata: sizes
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getSizeById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const size = await prisma.size.findUnique({
            where: { id },
            select: SIZE_PUBLIC_SELECT
        });
        if (!size) throw new NotFoundError('Size not found');

        const formattedSize = {
            ...size,
            variantCount: size._count.variants
        };

        return new OK({
            message: 'Get size successfully',
            metadata: formattedSize
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const updateSize = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { error, value } = updateSizeSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(d => d.details).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { name, value: sizeValue, isActive } = value;

        const size = await prisma.size.findUnique({
            where: { id }
        });
        if (!size) throw new NotFoundError('Size not found');

        if (name && name !== size.name) {
            const existingSize = await prisma.size.findUnique({
                where: { name }

            })
            if (existingSize) throw new ConflictRequestError('Size name already exists');
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (sizeValue !== undefined) updateData.value = sizeValue;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedSize = await prisma.size.update({
            where: { id },
            data: updateData,
            select: SIZE_PUBLIC_SELECT
        });

        const formattedSize = {
            ...updatedSize,
            variantCount: updatedSize._count.variants
        };

        return new OK({
            message: 'Size updated successfully',
            metadata: formattedSize
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const deleteSize = async (req, res, next) => {
    try {
        const { id } = req.params;

        const size = await prisma.size.findUnique({
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
        if (!size) throw new BadRequestError('Size not found');

        if (size._count.variants > 0) {
            throw new BadRequestError(
                `Cannot delete size. It is being used by ${size._count.productVariants} variant(s)`
            );
        }

        await prisma.size.delete({
            where: { id }
        });

        return new OK({
            message: 'Size deleted successfully'
        }).send(res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSize,
    getAllSizesAdmin,
    getAllSizesClient,
    getSizeById,
    updateSize,
    deleteSize
}