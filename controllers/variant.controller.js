const { PrismaClient } = require('@prisma/client');
const { createVariantSchema, getAllVariantsSchema, updateVariantSchema } = require('../middlewares/validations/variant.validation');
const { BadRequestError, NotFoundError, ConflictRequestError } = require('../utils/core/errorResponse');
const { generateSlugAndCheckExists } = require('../utils/generateSlug');
const { Created, OK } = require('../utils/core/successResponse');
const prisma = new PrismaClient();

const createVariant = async (req, res, next) => {
    try {
        const { error, value } = createVariantSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { productId, colorId, sizeId } = value;

        let newVariant;
        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findFirst({
                where: { id: productId, isDeleted: false },
                select: { id: true, name: true }
            });
            if (!product) throw new NotFoundError("Product not found");

            let color;
            if (colorId) {
                color = await tx.color.findFirst({
                    where: { id: colorId, isActive: true },
                    select: { name: true }
                })
                if (!color) throw new NotFoundError("Color not found or inactive");
            }

            let size;
            if (sizeId) {
                size = await tx.size.findFirst({
                    where: { id: sizeId, isActive: true },
                    select: { value: true }
                });
                if (!size) throw new NotFoundError("Size not found or inactive")
            }

            const existingVariant = await tx.productVariant.findFirst({
                where: {
                    productId,
                    colorId: colorId || null,
                    sizeId: sizeId || null,
                    isDeleted: false
                }
            });
            if (existingVariant) throw new ConflictRequestError('Variant with this color and size combination already exists');

            const shortName = (product?.name || '').split(/\s+/).map(w => w[0]).join('');
            const baseSku = `${shortName} ${color ? color.name : ""} ${size ? size.value : ""}`.toUpperCase();

            const sku = await generateSlugAndCheckExists(baseSku, async (sku) => {
                return await tx.productVariant.findUnique({
                    where: { sku }
                });
            }, { lower: false });
            if (!sku) throw new ConflictRequestError('SKU already exists');

            newVariant = await tx.productVariant.create({
                data: {
                    productId,
                    colorId: colorId || null,
                    sizeId: sizeId || null,
                    sku: sku,
                    ...value
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    color: {
                        select: {
                            id: true,
                            name: true,
                            hex: true
                        }
                    },
                    size: {
                        select: {
                            id: true,
                            name: true,
                            value: true
                        }
                    }
                },
            });

            await tx.product.update({
                where: { id: productId },
                data: {
                    stock: { increment: value.stock }
                }
            });
        });

        const formattedVariant = {
            id: newVariant.id,
            product: newVariant.product,
            color: newVariant.color,
            size: newVariant.size,
            sku: newVariant.sku,
            price: newVariant.price,
            stock: newVariant.stock,
            isPublished: newVariant.isPublished,
            createdAt: newVariant.createdAt,
            updatedAt: newVariant.updatedAt
        };

        return new Created({
            message: 'Variant created successfully',
            metadata: formattedVariant
        }).send(res);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

const getAllVariants = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const { error, value } = getAllVariantsSchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const product = await prisma.product.findFirst({
            where: { id: productId, isDeleted: false },
            select: { id: true, name: true, slug: true }
        });
        if (!product) throw new NotFoundError('Product not found');

        const {
            page, limit, sortBy, sortOrder, colorId,
            sizeId, isPublished, minPrice, maxPrice,
            minStock, maxStock, deletedFrom, deletedTo
        } = value;

        const skip = (page - 1) * limit;

        const where = { productId, isDeleted: false };

        if (colorId) where.colorId = colorId;
        if (sizeId) where.sizeId = sizeId;
        if (isPublished !== undefined) where.isPublished = isPublished;

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
        }
        if (minStock !== undefined || maxStock !== undefined) {
            where.stock = {};
            if (minStock !== undefined) where.stock.gte = minStock;
            if (maxStock !== undefined) where.stock.lte = maxStock;
        }
        if (deletedFrom !== undefined || deletedTo !== undefined) {
            where.deletedAt = {};
            if (deletedFrom) where.deletedAt.gte = new Date(deletedFrom);
            if (deletedTo) where.deletedAt.lte = new Date(deletedTo);
        }

        const orderBy = { [sortBy]: sortOrder };

        const [variants, totalCount] = await Promise.all([
            prisma.productVariant.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: {
                    id: true,
                    sku: true,
                    price: true,
                    stock: true,
                    isPublished: true,
                    color: {
                        select: {
                            id: true,
                            name: true,
                            hex: true,
                            isActive: true
                        }
                    },
                    size: {
                        select: {
                            id: true,
                            name: true,
                            value: true,
                            isActive: true
                        }
                    },
                    images: {
                        orderBy: [
                            { isMain: 'desc' },
                            { sortOrder: 'asc' }
                        ],
                        select: {
                            id: true,
                            url: true,
                            alt: true,
                            isMain: true
                        },
                        take: 1
                    },
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.productVariant.count({ where })
        ]);

        const formattedVariants = variants.map(variant => ({
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            isPublished: variant.isPublished,
            color: variant.color,
            size: variant.size,
            mainImage: variant.images[0] || null,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt
        }));

        const totalPages = Math.ceil(totalCount / limit);

        return new OK({
            message: 'Get variants successfully',
            metadata: {
                product,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                },
                variants: formattedVariants
            }
        }).send(res);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

const getVariantById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const variant = await prisma.productVariant.findUnique({
            where: { id, isDeleted: false },
            select: {
                id: true,
                sku: true,
                price: true,
                stock: true,
                isPublished: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        price: true,
                        stock: true,
                        isPublished: true
                    }
                },
                color: {
                    select: {
                        id: true,
                        name: true,
                        hex: true,
                        isActive: true
                    }
                },
                size: {
                    select: {
                        id: true,
                        name: true,
                        value: true,
                        isActive: true
                    }
                },
                images: {
                    orderBy: [
                        { isMain: 'desc' },
                        { sortOrder: 'asc' }
                    ],
                    select: {
                        id: true,
                        url: true,
                        alt: true,
                        isMain: true,
                        sortOrder: true
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });

        if (!variant) throw new NotFoundError('Variant not found');

        const formattedVariant = {
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            isPublished: variant.isPublished,
            product: {
                ...variant.product,
                price: variant.product.price
            },
            color: variant.color,
            size: variant.size,
            images: variant.images,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt
        };

        return new OK({
            message: 'Get variant successfully',
            metadata: formattedVariant
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const updateVariant = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { error, value } = updateVariantSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { colorId, sizeId, price, stock, isPublished } = value;

        let updatedVariant;
        let oldStock;

        await prisma.$transaction(async (tx) => {
            const variant = await tx.productVariant.findFirst({
                where: { id, isDeleted: false },
                select: {
                    id: true,
                    productId: true,
                    colorId: true,
                    sizeId: true,
                    sku: true,
                    stock: true,
                    product: {
                        select: { name: true }
                    },
                    color: {
                        select: { name: true }
                    },
                    size: {
                        select: { value: true }
                    }
                }
            });
            if (!variant) throw new NotFoundError('Variant not found');

            oldStock = variant.stock;

            const updateData = {};

            // color
            let color;
            if (colorId !== undefined) {
                if (colorId === null) {
                    updateData.colorId = null
                } else {
                    color = await tx.color.findFirst({
                        where: { id: colorId, isActive: true },
                        select: { name: true }
                    });
                    if (!color) throw new NotFoundError('Color not found or inactive');
                    updateData.colorId = colorId;
                }
            }

            // size
            let size;
            if (sizeId !== undefined) {
                if (size === null) {
                    updateData.sizeId = null;
                } else {
                    size = await tx.size.findFirst({
                        where: { id: sizeId, isActive: true },
                        select: { value: true }
                    });
                    if (!size) throw new NotFoundError('Size not found or inactive');
                    updateData.sizeId = sizeId;
                }
            }

            // check trung doi voi variant co ca color va size
            if (colorId !== undefined || sizeId !== undefined) {
                const newColorId = colorId !== undefined ? (colorId || null) : variant.colorId;
                const newSizeId = sizeId !== undefined ? (sizeId || null) : variant.sizeId;

                if (!newColorId && !newSizeId) throw new BadRequestError('At least one of colorId or sizeId must be selected');

                const existingVariant = await tx.productVariant.findFirst({
                    where: {
                        productId: variant.productId,
                        colorId: newColorId,
                        sizeId: newSizeId,
                        isDeleted: false,
                        id: { not: id }
                    }
                });
                if (existingVariant) throw new ConflictRequestError('Variant with this color and size combination already exists');

                // sku
                const s = size ? size.value : variant.size.value || "";
                const c = color ? color.name : variant.color.name || "";
                const shortName = (variant.product.name || '').split(/\s+/).map(w => w[0]).join('');
                const baseSku = `${shortName} ${c} ${s}`.toUpperCase();

                const sku = await generateSlugAndCheckExists(baseSku, async (sku) => {
                    return await tx.productVariant.findUnique({
                        where: { sku }
                    });
                }, { lower: false });
                if (sku) {
                    updateData.sku = sku
                } else {
                    throw new ConflictRequestError('SKU already exists')
                };
            }

            if (price !== undefined) updateData.price = price;
            if (stock !== undefined) updateData.stock = stock;
            if (isPublished !== undefined) updateData.isPublished = isPublished;

            updatedVariant = await tx.productVariant.update({
                where: { id },
                data: updateData,
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            stock: true
                        }
                    },
                    color: {
                        select: {
                            id: true,
                            name: true,
                            hex: true
                        }
                    },
                    size: {
                        select: {
                            id: true,
                            name: true,
                            value: true
                        }
                    },
                    images: {
                        orderBy: [
                            { isMain: 'desc' },
                            { sortOrder: 'asc' }
                        ],
                        select: {
                            id: true,
                            url: true,
                            alt: true,
                            isMain: true
                        },
                        take: 1
                    }
                }
            })

            if (stock !== undefined && stock !== oldStock) {
                const stockDifference = stock - oldStock;

                await tx.product.update({
                    where: { id: variant.productId },
                    data: {
                        stock: { increment: stockDifference }
                    }
                });
            }
        });

        const formattedVariant = {
            id: updatedVariant.id,
            product: {
                id: updatedVariant.product.id,
                name: updatedVariant.product.name,
                slug: updatedVariant.product.slug
            },
            color: updatedVariant.color,
            size: updatedVariant.size,
            sku: updatedVariant.sku,
            price: updatedVariant.price,
            stock: updatedVariant.stock,
            isPublished: updatedVariant.isPublished,
            mainImage: updatedVariant.images[0] || null,
            createdAt: updatedVariant.createdAt,
            updatedAt: updatedVariant.updatedAt
        };

        return new OK({
            message: 'Variant updated successfully',
            metadata: formattedVariant
        }).send(res);

    } catch (error) {
        console.log(error);
        next(error);
    }
};

const softDeleteVariant = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (tx) => {
            const variant = await tx.productVariant.findFirst({
                where: { id, isDeleted: false },
                select: { id: true, stock: true }
            });
            if (!variant) throw new NotFoundError('Variant not found or already deleted');

            await tx.productVariant.update({
                where: { id },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    isPublished: false
                }
            });

            await tx.product.update({
                where: { id: variant.productId },
                data: {
                    stock: { decrement: variant.stock }
                }
            });
        });

        return new OK({
            message: 'Variant deleted successfully'
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const restoreVariant = async (req, res, next) => {
    try {
        const { id } = req.params;

        let restoredVariant;
        await prisma.$transaction(async (tx) => {
            const variant = await tx.productVariant.findUnique({
                where: { id, isDeleted: true },
                select: {
                    id: true,
                    productId: true,
                    colorId: true,
                    sizeId: true,
                    stock: true
                }
            });
            if (!variant) throw new NotFoundError('Variant not found in trash');

            const product = await tx.product.findUnique({
                where: { id: variant.productId },
                select: { id: true, isDeleted: false, stock: true }
            });
            if (!product) throw new NotFoundError('Product not found');
            if (product.isDeleted) throw new BadRequestError('Cannot restore: Product has been deleted');

            // neu co color => kiem tra con ton tai hoac active hay ko
            if (variant.colorId) {
                const color = await tx.color.findUnique({
                    where: { id: variant.colorId }
                });

                if (!color || !color.isActive) {
                    throw new BadRequestError('Cannot restore: Color has been deleted or is inactive');
                }
            }

            // neu co size => kiem tra con ton tai hoac active hay ko
            if (variant.sizeId) {
                const size = await tx.size.findUnique({
                    where: { id: variant.sizeId }
                });

                if (!size || !size.isActive) {
                    throw new BadRequestError('Cannot restore: Size has been deleted or is inactive');
                }
            }

            const existingVariant = await tx.productVariant.findFirst({
                where: {
                    productId: variant.productId,
                    colorId: variant.colorId,
                    sizeId: variant.sizeId,
                    isDeleted: false,
                    id: { not: id }
                }
            });
            if (existingVariant) throw new ConflictRequestError('Cannot restore: A variant with this color and size combination already exists');

            restoredVariant = await tx.productVariant.update({
                where: { id },
                data: {
                    isDeleted: false,
                    deletedAt: null,
                    isPublished: false,
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true
                            }
                        },
                        color: {
                            select: {
                                id: true,
                                name: true,
                                hex: true
                            }
                        },
                        size: {
                            select: {
                                id: true,
                                name: true,
                                value: true
                            }
                        },
                        images: {
                            orderBy: [
                                { isMain: 'desc' },
                                { sortOrder: 'asc' }
                            ],
                            select: {
                                id: true,
                                url: true,
                                alt: true,
                                isMain: true
                            },
                            take: 1
                        }
                    }
                }
            });

            await tx.product.update({
                where: { id: variant.productId },
                data: {
                    stock: { increment: variant.stock }
                }
            })
        });

        const formattedVariant = {
            id: restoredVariant.id,
            product: restoredVariant.product,
            color: restoredVariant.color,
            size: restoredVariant.size,
            sku: restoredVariant.sku,
            price: restoredVariant.price,
            stock: restoredVariant.stock,
            isPublished: restoredVariant.isPublished,
            mainImage: restoredVariant.images[0] || null,
            createdAt: restoredVariant.createdAt,
            updatedAt: restoredVariant.updatedAt
        };

        return new OK({
            message: 'Variant restored successfully',
            data: formattedVariant
        }).send(res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createVariant,
    getAllVariants,
    getVariantById,
    updateVariant,
    softDeleteVariant,
    restoreVariant
}