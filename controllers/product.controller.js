const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { deleteMultipleImages, deleteImage } = require("../utils/cloudinary.helper");
const { createProductSchema, updateProductImageSchema, uploadProductImagesSchema, getAllProductsAdminSchema, updateProductSchema, getAllProductsClientSchema, } = require('../middlewares/validations/product.validation');
const { Created, OK } = require('../utils/core/successResponse');
const { ConflictRequestError, BadRequestError, NotFoundError } = require('../utils/core/errorResponse');
const { generateSlugAndCheckExists } = require('../utils/generateSlug');

/** Admin */
const createProduct = async (req, res, next) => {
    try {
        const { error, value } = createProductSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { name, description, price, stock, isPublished, categoryId, styleIds } = value;

        let newProduct;
        await prisma.$transaction(async (tx) => {
            // kiem tra category co ton tai hoac isPublished = true hay ko
            const category = await tx.category.findUnique({
                where: { id: categoryId, isDeleted: false, isPublished: true }
            })
            if (!category) throw new NotFoundError('Category not found or inactive');

            // kiem tra mang styles
            if (styleIds && styleIds.length > 0) {
                const styles = await tx.style.findMany({
                    where: {
                        id: { in: styleIds },
                        isActive: true
                    }
                });
                if (styles.length !== styleIds.length) throw new BadRequestError('One or more styles not found or inactive');
            }

            const slug = await generateSlugAndCheckExists(name, async (slug) => {
                return await tx.product.findFirst({
                    where: { slug }
                })
            })
            if (!slug) throw new ConflictRequestError('Slug already exists');

            newProduct = await tx.product.create({
                data: {
                    name, slug, price, stock, categoryId,
                    description: description || null,
                    isPublished,
                    // gán style
                    ...(styleIds && styleIds.length > 0 && {
                        styles: {
                            create: styleIds.map(styleId => ({ styleId }))
                        }
                    })
                },
                include: {
                    category: {
                        select: { id: true, name: true, slug: true }
                    },
                    styles: {
                        include: {
                            style: {
                                select: { id: true, name: true, slug: true }
                            }
                        }
                    }
                }
            });
        });

        const formattedProduct = {
            id: newProduct.id,
            name: newProduct.name,
            slug: newProduct.slug,
            description: newProduct.description,
            price: newProduct.price,
            stock: newProduct.stock,
            isPublished: newProduct.isPublished,
            category: newProduct.category,
            styles: newProduct.styles.map(s => s.style),
            createdAt: newProduct.createdAt,
            updatedAt: newProduct.updatedAt
        }

        return new Created({
            message: 'Product created successfully',
            metadata: formattedProduct
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getAllProductsAdmin = async (req, res, next) => {
    try {
        const { error, value } = getAllProductsAdminSchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const {
            page, limit, sortBy, sortOrder, search, isDeleted,
            category, isPublished, stock, styles,
            minPrice, maxPrice, minStock, maxStock,
            createdFrom, createdTo, updatedFrom, updatedTo,
            deletedFrom, deletedTo
        } = value;

        const skip = (page - 1) * limit;
        const where = { isDeleted: false };

        // sort
        const orderBy = { [sortBy]: sortOrder };

        // search
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ];
        }

        // filters
        if (category) {
            where.OR = [
                { categoryId: category },
                { category: { slug: { equals: category } } },
            ]
        }
        if (styles) {
            const stylesArray = styles.split(',').map(i => i.trim()).filter(Boolean);

            if (stylesArray.length > 0) {
                where.OR = [
                    { styles: { some: { styleId: { in: stylesArray } } } },
                    { styles: { some: { style: { slug: { in: stylesArray } } } } }
                ]
            }
        }
        if (isPublished !== undefined) where.isPublished = isPublished;
        if (isDeleted !== undefined) where.isDeleted = isDeleted;
        if (stock !== undefined && stock === true) {
            where.stock = { gt: 0 }
        } else if (stock !== undefined && stock === false) {
            where.stock = { lte: 0 }
        }

        // range
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
        if (createdFrom || createdTo) {
            where.createdAt = {};
            if (createdFrom) where.createdAt.gte = new Date(createdFrom);
            if (createdTo) where.createdAt.lte = new Date(createdTo);
        }
        if (updatedFrom || updatedTo) {
            where.updatedAt = {};
            if (updatedFrom) where.updatedAt.gte = new Date(updatedFrom);
            if (updatedTo) where.updatedAt.lte = new Date(updatedTo);
        }
        if (deletedFrom || deletedTo) {
            where.deletedAt = {};
            if (deletedFrom) where.deletedAt.gte = new Date(deletedFrom);
            if (deletedTo) where.deletedAt.lte = new Date(deletedTo);
        }

        const [products, totalCount] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    price: true,
                    stock: true,
                    isPublished: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    styles: {
                        select: {
                            style: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true
                                }
                            }
                        }
                    },
                    images: {
                        where: {
                            variantId: null,
                            isMain: true
                        },
                        select: {
                            id: true,
                            url: true,
                            alt: true
                        },
                        take: 1,
                        orderBy: { sortOrder: 'asc' }
                    },
                    _count: {
                        select: {
                            variants: true,
                            images: true
                        }
                    },
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.product.count({ where })
        ]);

        const formattedProducts = products.map(product => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            stock: product.stock,
            isPublished: product.isPublished,
            category: product.category,
            styles: product.styles.map(ps => ps.style),
            mainImage: product.images[0] || null,
            variantCount: product._count.variants,
            imageCount: product._count.images,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        }));

        const totalPages = Math.ceil(totalCount / limit);

        return new OK({
            message: 'Get products successfully',
            metadata: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                },
                products: formattedProducts
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getProductByIdAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await prisma.product.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                price: true,
                stock: true,
                isPublished: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        isPublished: true
                    }
                },
                styles: {
                    select: {
                        style: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                description: true,
                                isActive: true
                            }
                        }
                    }
                },
                images: {
                    where: {
                        variantId: null
                    },
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
                variants: {
                    where: { isDeleted: false },
                    orderBy: { createdAt: 'asc' },
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
                        Size: {
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
                        isDeleted: true,
                        deletedAt: true,
                        createdAt: true,
                        updatedAt: true
                    }
                },
                isDeleted: true,
                deletedAt: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!product) throw new NotFoundError('Product not found');

        const formattedProduct = {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            stock: product.stock,
            isPublished: product.isPublished,

            category: product.category,

            styles: product.styles.map(ps => ps.style),

            images: product.images,

            variants: product.variants.map(variant => ({
                id: variant.id,
                sku: variant.sku,
                price: variant.price,
                stock: variant.stock,
                isPublished: variant.isPublished,
                color: variant.color,
                size: variant.Size,
                images: variant.images,
                isDeleted: variant.deletedAt,
                deletedAt: variant.deletedAt,
                createdAt: variant.createdAt,
                updatedAt: variant.updatedAt
            })),

            // summary
            summary: {
                totalVariants: product.variants.length,
                totalProductImages: product.images.length,
                totalVariantImages: product.variants.reduce((sum, v) => sum + v.images.length, 0),
                totalImages: product.images.length + product.variants.reduce((sum, v) => sum + v.images.length, 0),
                totalStock: product.stock + product.variants.reduce((sum, v) => sum + v.stock, 0),
                publishedVariants: product.variants.filter(v => v.isPublished).length,
                priceRange: {
                    min: Math.min(
                        product.price,
                        ...product.variants.map(v => v.price)
                    ),
                    max: Math.max(
                        product.price,
                        ...product.variants.map(v => v.price)
                    )
                }
            },
            isDeleted: product.isDeleted,
            deletedAt: product.deletedAt,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        };

        return new OK({
            message: 'Get product successfully',
            metadata: formattedProduct
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { error, value } = updateProductSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { name, description, price, stock, isPublished, categoryId, styleIds } = value;

        let updatedProduct;
        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id, isDeleted: false },
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            });
            if (!product) throw new NotFoundError('Product not found');

            const updateData = {};

            if (name && name !== product.name) {

                const genSlug = await generateSlugAndCheckExists(name, async (slug) => {
                    return await tx.product.findFirst({
                        where: {
                            id: { not: id },
                            slug
                        }
                    })
                })
                if (!genSlug) throw new ConflictRequestError('Slug already exists');

                updateData.name = name;
                updateData.slug = genSlug;
            }

            if (description !== undefined) updateData.description = description;
            if (price !== undefined) updateData.price = price;
            if (stock !== undefined) updateData.stock = stock;
            if (isPublished !== undefined) updateData.isPublished = isPublished;
            if (categoryId) {
                const category = await tx.category.findUnique({
                    where: { id: categoryId, isDeleted: false, isPublished: true }
                });
                if (!category) throw new NotFoundError('Category not found or inactive');

                updateData.categoryId = categoryId;
            }
            if (styleIds !== undefined) {
                if (styleIds.length > 0) {
                    const styles = await tx.style.findMany({
                        where: {
                            id: { in: styleIds },
                            isActive: true
                        }
                    });
                    if (styles.length !== styleIds.length) {
                        throw new BadRequestError('One or more styles not found or inactive');
                    }

                    await tx.productStyle.deleteMany({
                        where: { productId: id }
                    });

                    updateData.styles = {
                        create: styleIds.map(styleId => ({
                            styleId
                        }))
                    };
                } else {
                    await tx.productStyle.deleteMany({
                        where: { productId: id }
                    });
                }
            }

            updatedProduct = await tx.product.update({
                where: { id },
                data: updateData,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    styles: {
                        include: {
                            style: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true
                                }
                            }
                        }
                    },
                    images: {
                        where: { variantId: null },
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
                    _count: {
                        select: {
                            variants: true,
                            images: true
                        }
                    }
                }
            })

        });

        const formattedProduct = {
            id: updatedProduct.id,
            name: updatedProduct.name,
            slug: updatedProduct.slug,
            description: updatedProduct.description,
            price: updatedProduct.price,
            stock: updatedProduct.stock,
            isPublished: updatedProduct.isPublished,
            category: updatedProduct.category,
            styles: updatedProduct.styles.map(ps => ps.style),
            mainImage: updatedProduct.images[0] || null,
            variantCount: updatedProduct._count.variants,
            imageCount: updatedProduct._count.images,
            createdAt: updatedProduct.createdAt,
            updatedAt: updatedProduct.updatedAt
        };

        return new OK({
            message: 'Product updated successfully',
            metadata: formattedProduct
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const softDeleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id, isDeleted: false },
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: {
                            variants: {
                                where: { isDeleted: false }
                            }
                        }
                    }
                }
            });
            if (!product) throw new NotFoundError('Product not found or already deleted');

            // soft delete product
            await tx.product.update({
                where: { id },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    isPublished: false
                }
            });

            // soft delete all variants
            if (product._count.variants > 0) {
                await tx.productVariant.updateMany({
                    where: {
                        productId: id,
                        isDeleted: false
                    },
                    data: {
                        isDeleted: true,
                        deletedAt: new Date(),
                        isPublished: false
                    }
                });
            }
        });

        return new OK({
            message: 'Product deleted successfully'
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const restoreProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        let restoredProduct;
        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id, isDeleted: true },
                select: {
                    id: true,
                    name: true,
                    categoryId: true,
                    _count: {
                        select: {
                            variants: { where: { isDeleted: true } }
                        }
                    }
                }
            });
            if (!product) throw new NotFoundError('Product not found in trash');

            // kiem tra xem category bi xoa thi ko the khoi phuc, can thay doi category
            const category = await tx.category.findUnique({
                where: { id: product.categoryId },
            });
            if (!category || category.isDeleted) {
                throw new BadRequestError(
                    'Cannot restore: Category has been deleted or does not exist'
                );
            }
            if (!category.isPublished) throw new BadRequestError('Cannot restore: Category is not published');

            restoredProduct = await tx.product.update({
                where: { id },
                data: {
                    isDeleted: false,
                    deletedAt: null,
                    isPublished: false // khoi phuc xong se ko public
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    styles: {
                        select: {
                            style: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                }
                            }
                        }
                    },
                    images: {
                        where: { variantId: null },
                        orderBy: [
                            { isMain: 'desc' },
                            { sortOrder: 'asc' }
                        ],
                        select: {
                            id: true,
                            url: true,
                            alt: true
                        },
                        take: 1
                    },
                    _count: {
                        select: {
                            variants: true,
                            images: true
                        }
                    }
                }
            });

            if (product._count.variants > 0) {
                await tx.productVariant.updateMany({
                    where: {
                        productId: id,
                        isDeleted: true
                    },
                    data: {
                        isDeleted: false,
                        deletedAt: null,
                        isPublished: false
                    }
                });
            }
        });

        const formattedProduct = {
            id: restoredProduct.id,
            name: restoredProduct.name,
            slug: restoredProduct.slug,
            description: restoredProduct.description,
            price: restoredProduct.price,
            stock: restoredProduct.stock,
            isPublished: restoredProduct.isPublished,
            category: restoredProduct.category,
            styles: restoredProduct.styles.map(ps => ps.style),
            mainImage: restoredProduct.images[0] || null,
            variantCount: restoredProduct._count.variants,
            imageCount: restoredProduct._count.images,
            createdAt: restoredProduct.createdAt,
            updatedAt: restoredProduct.updatedAt
        };

        return new OK({
            message: 'Product restored successfully',
            metadata: formattedProduct
        }).send(res);
    } catch (error) {
        next(error);
    }
};

/**
 *  Để xoá vĩnh viễn sản phẩm cần 2 bước
 *  1. xoá mềm => 2. xoá vĩnh viễn, giống như bước xác nhận vậy.
 */
const permanentDeleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id, isDeleted: true },
                select: {
                    id: true,
                    name: true,
                    images: {
                        select: {
                            id: true,
                            url: true
                        }
                    },
                    variants: {
                        where: { isDeleted: true },
                        select: {
                            id: true,
                            images: {
                                select: {
                                    id: true,
                                    url: true
                                }
                            }
                        }
                    }
                }
            });
            if (!product) throw new NotFoundError('Product not found in trash');

            // biến gom url image
            const imageUrls = [];
            product.images.forEach(img => imageUrls.push(img.url));

            product.variants.forEach(variant => {
                variant.images.forEach(img => imageUrls.push(img.url));
            });

            // cascade sẽ xoá các bagnr quan hệ variants, images, styles
            await tx.product.delete({
                where: { id }
            });

            if (imageUrls.length > 0) {
                await deleteMultipleImages(imageUrls, 'shop.co/products');
            }
        });

        return new OK({
            message: 'Product permanently deleted'
        }).send(res);
    } catch (error) {
        next(error);
    }
};

// Image 
const uploadProductImages = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const files = req.files;
        if (!files || files.length === 0) throw new BadRequestError('No images provided');

        const { error, value } = uploadProductImagesSchema.validate({
            productId,
            variantId: req.body.variantId || null,
            alts: req.body.alts ? JSON.parse(req.body.alts) : [],
            isMain: req.body.isMain === 'true'
        }, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            // neu validate loi thi xoa het cac anh da tai len cloudinary
            throw new BadRequestError(error.details.map(d => d.message).join(', '));
        }

        const { variantId, alts, isMain } = value;

        let uploadedImages;
        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: productId, isDeleted: false }
            });
            if (!product) throw new NotFoundError('Product not found');

            if (variantId) {
                // kiem tra ton tai va no co thuoc san pham nay ko
                const variant = await tx.productVariant.findUnique({
                    where: { id: variantId, productId, isDeleted: false }
                });
                if (!variant) throw new NotFoundError('Variant not found or does not belong to this product');
            }

            if (isMain) {
                await tx.productImage.updateMany({
                    where: {
                        productId,
                        variantId: variantId || null,
                        isDeleted: false
                    },
                    data: { isMain: false }
                })
            }

            const maxSort = await tx.productImage.findFirst({
                where: {
                    productId,
                    variantId: variantId || null,
                },
                orderBy: { sortOrder: 'desc' },
                select: { sortOrder: true }
            });

            const startSortOrder = maxSort ? maxSort.sortOrder + 1 : 0;

            uploadedImages = await Promise.all(
                files.map(async (file, index) => {
                    return await tx.productImage.create({
                        data: {
                            productId,
                            variantId: variantId || null,
                            url: file.path,
                            alt: alts[index] || null,
                            isMain: isMain && index === 0,
                            sortOrder: startSortOrder + index
                        },
                        select: {
                            id: true,
                            url: true,
                            alt: true,
                            isMain: true,
                            sortOrder: true,
                            createdAt: true
                        }
                    });
                })
            );
        });

        return new Created({
            message: `${uploadedImages.length} image(s) uploaded successfully`,
            metadata: uploadedImages
        }).send(res);
    } catch (error) {
        // Xóa tất cả ảnh vừa upload nếu có lỗi
        if (req.files && req.files.length > 0) {
            const arrPaths = req.files.map(file => file.path);
            await deleteMultipleImages(arrPaths, 'shop.co/products');
        }
        next(error);
    }
};

const getProductImages = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { variantId } = req.query;

        const product = await prisma.product.findUnique({
            where: { id: productId, isDeleted: false }
        });
        if (!product) throw new NotFoundError('Product not found');

        const where = {
            productId,
            isDeleted: false
        };

        if (variantId) {
            where.variantId = variantId;
        } else if (variantId === 'null' && variantId === '') {
            where.variantId = null;
        }

        const images = await prisma.productImage.findMany({
            where,
            orderBy: [
                { isMain: 'desc' },
                { sortOrder: 'asc' }
            ],
            select: {
                id: true,
                url: true,
                alt: true,
                isMain: true,
                sortOrder: true,
                variantId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return new OK({
            message: 'Get product images successfully',
            metadata: images
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const updateProductImage = async (req, res, next) => {
    try {
        const { imageId } = req.params;

        const { error, value } = updateProductImageSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) throw new BadRequestError(error.details.map(d => d.message).join(', '));

        let updatedImage;
        await prisma.$transaction(async (tx) => {
            const image = await tx.productImage.findUnique({
                where: { id: imageId }
            });
            if (!image) throw new NotFoundError('Image not found');

            if (value.isMain === true) {
                await tx.productImage.updateMany({
                    where: {
                        productId: image.productId,
                        variantId: image.variantId,
                        id: { not: imageId }
                    },
                    data: { isMain: false }
                });
            }

            if (value.sortOrder !== image.sortOrder) {
                const images = await tx.productImage.findMany({
                    where: {
                        productId: image.productId,
                        variantId: image.variantId,
                        id: { not: imageId }
                    },
                    orderBy: { sortOrder: 'asc' }
                });

                images.splice(value.sortOrder, 0, image);

                await Promise.all(images.map((img, index) => (
                    tx.productImage.update({
                        where: { id: img.id },
                        data: { sortOrder: index }
                    })
                )));
            }

            updatedImage = await tx.productImage.update({
                where: { id: imageId },
                data: value,
                select: {
                    id: true,
                    url: true,
                    alt: true,
                    isMain: true,
                    sortOrder: true,
                    variantId: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
        });

        return new OK({
            message: 'Image updated successfully',
            metadata: updatedImage
        }).send(res);
    } catch (error) {
        next(error)
    }
};

const deleteProductImage = async (req, res, next) => {
    try {
        const { imageId } = req.params;

        let imageUrl;
        await prisma.$transaction(async (tx) => {
            const image = await tx.productImage.findUnique({
                where: { id: imageId }
            });
            if (!image) throw new NotFoundError('Image not found');

            imageUrl = image.url;

            if (image.isMain) {
                const remainingImagesCount = tx.productImage.count({
                    where: {
                        productId: image.productId,
                        variantId: image.variantId,
                        id: { not: imageId }
                    }
                });

                if (remainingImagesCount > 0) {
                    const firstImage = await tx.productImage.findFirst({
                        where: {
                            productId: image.productId,
                            variantId: image.variantId,
                            id: { not: imageId }
                        },
                        orderBy: { sortOrder: 'asc' }
                    });

                    if (firstImage) {
                        await tx.productImage.update({
                            where: { id: firstImage.id },
                            data: { isMain: true }
                        });
                    }
                }
            }

            await tx.productImage.delete({
                where: { id: imageId }
            });
        });

        // delete from cloudinary
        if (imageUrl && imageUrl.includes('cloudinary')) {
            await deleteImage(imageUrl, 'shop.co/products')
        }

        return new OK({
            message: 'Image deleted successfully'
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const bulkDeleteProductImages = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { imageIds } = req.body;

        if (!Array.isArray(imageIds) || imageIds.length === 0) {
            throw new BadRequestError('imageIds must be a non-empty array');
        }

        let deletedImages;
        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: productId }
            });
            if (!product) throw new NotFoundError('Product not found');

            deletedImages = await tx.productImage.findMany({
                where: {
                    id: { in: imageIds },
                    productId
                },
                select: {
                    id: true,
                    url: true,
                    isMain: true,
                    variantId: true
                }
            });
            if (deletedImages.length === 0) throw new NotFoundError('No images found to delete');

            const deletingMainImages = deletedImages.filter(img => img.isMain);
            if (deletingMainImages.length > 0) {
                for (const mainImage of deletingMainImages) {
                    const newMainImage = await tx.productImage.findFirst({
                        where: {
                            productId,
                            variantId: mainImage.variantId,
                            id: { notIn: imageIds }
                        },
                        orderBy: { sortOrder: 'asc' }
                    });

                    if (newMainImage) {
                        await tx.productImage.update({
                            where: { id: newMainImage.id },
                            data: { isMain: true }
                        });
                    }
                }
            }

            await tx.productImage.deleteMany({
                where: {
                    id: { in: imageIds },
                    productId
                }
            });
        });

        const imagesCloudinaryUrl = deletedImages.map(img => img.url).filter(url => url.includes('cloudinary'));
        if (imagesCloudinaryUrl.length > 0) {
            await deleteMultipleImages(imagesCloudinaryUrl, 'shop.co/products');
        }

        return new OK({
            message: `${deletedImages.length} image(s) deleted successfully`
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const reorderProductImages = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { imageOrders, variantId } = req.body;

        if (!Array.isArray(imageOrders) || imageOrders.length === 0) {
            throw new BadRequestError('imageOrders must be a non-empty array');
        }

        const isValid = imageOrders.every(item => item.id && typeof item.sortOrder === 'number' && item.sortOrder >= 0);
        if (!isValid) throw new BadRequestError('Each item must have id and sortOrder (non-negative integer)');

        // kiem tra sort unique
        const sortOrders = imageOrders.map(item => item.sortOrder);
        const uniqueSortOrders = new Set(sortOrders);
        if (uniqueSortOrders.size !== sortOrders.length) {
            throw new BadRequestError('sortOrder values must be unique');
        }

        // sap xep lai mang phai tang dan va lien tuc 0,1,2,3,..
        const sortedOrders = [...sortOrders].sort((a, b) => a - b);
        const isSequential = sortedOrders.every((order, index) => order === index);
        if (!isSequential) {
            throw new BadRequestError('sortOrder must be a continuous sequence starting from 0 (e.g., 0, 1, 2, 3...)');
        }

        await prisma.$transaction(async (tx) => {
            const product = await prisma.product.findUnique({
                where: { id: productId }
            });
            if (!product) throw new NotFoundError('Product not found');

            // lay tat ca cac anh tu bang product/variant
            const allImages = await tx.productImage.findMany({
                where: { productId, variantId: variantId || null },
                select: { id: true }
            });

            // kiem tra tat ca anh trong mang allImages phai thuoc product/variant
            const imageIds = imageOrders.map(item => item.id);
            const allImageIds = allImages.map(img => img.id);

            // kiem tra 2 mang id tu client va id trong db phai khop
            const invalidIds = imageIds.filter(id => !allImageIds.includes(id));
            if (invalidIds.length > 0) {
                throw new BadRequestError(`Images not found or do not belong to this product: ${invalidIds.join(', ')}`);
            }

            if (imageIds.length !== allImageIds.length) {
                throw new BadRequestError(
                    `Must reorder all images. Expected ${allImageIds.length} images, got ${imageIds.length}`
                );
            }

            await Promise.all(
                imageOrders.map(item => (
                    tx.productImage.update({
                        where: { id: item.id },
                        data: { sortOrder: item.sortOrder }
                    })
                ))
            );
        });

        const updatedImages = await prisma.productImage.findMany({
            where: {
                productId,
                variantId: variantId || null
            },
            orderBy: [
                { isMain: 'desc' },
                { sortOrder: 'asc' }
            ],
            select: {
                id: true,
                url: true,
                alt: true,
                isMain: true,
                sortOrder: true,
                variantId: true
            }
        });

        // Final verification: check sortOrder sequence
        const finalSortOrders = updatedImages.map(img => img.sortOrder);
        const sortedFinal = [...finalSortOrders].sort((a, b) => a - b);
        const isFinalValid = sortedFinal.every((order, index) => order === index);

        if (!isFinalValid) {
            throw new Error('Database inconsistency: sortOrder sequence is invalid after update');
        }

        return new OK({
            message: 'Images reordered successfully',
            metadata: updatedImages
        }).send(res);
    } catch (error) {
        next(error);
    }
};

/** Client */
const getAllProductsClient = async (req, res, next) => {
    try {
        const { error, value } = getAllProductsClientSchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const {
            page, limit, sortBy, sortOrder, search,
            category, minPrice, maxPrice, styles
        } = value;

        const skip = (page - 1) * limit;
        const where = {
            isPublished: true,
            isDeleted: false
        };

        // sort
        let orderBy;
        if (sortBy === 'popular') {
            // tinh nang chua phat trien, dung de loc san pham ban duoc nhieu hoac duoc xem nhieu
            orderBy = { createdAt: 'desc' };
        } else {
            orderBy = { [sortBy]: sortOrder };
        }

        // search
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        }
        // category = id || slug
        if (category) {
            const getCategory = await prisma.category.findFirst({
                where: {
                    OR: [
                        { id: category },
                        { slug: category },
                    ],
                    isPublished: true,
                    isDeleted: false
                },
                select: { id: true }
            });

            if (!getCategory) {
                // ko tim thay category return trong
                return new OK({
                    message: 'Get products successfully',
                    metadata: {
                        products: [],
                        pagination: {
                            currentPage: page,
                            totalPages: 0,
                            totalCount: 0,
                            limit,
                            hasNextPage: false,
                            hasPrevPage: false
                        }
                    }
                }).send(res);
            }
            where.categoryId = getCategory.id;
        }
        if (styles) {
            const stylesArray = styles.split(',').map(i => i.trim()).filter(Boolean);

            if (stylesArray.length > 0) {
                const getStyles = await prisma.style.findMany({
                    where: {
                        OR: [
                            { id: { in: stylesArray } },
                            { slug: { in: stylesArray } },
                        ],
                        isActive: true
                    },
                    select: { id: true }
                });

                if (getStyles.length === 0) {
                    // ko co style nao return rong
                    return new OK({
                        message: 'Get products successfully',
                        metadata: {
                            products: [],
                            pagination: {
                                currentPage: page,
                                totalPages: 0,
                                totalCount: 0,
                                limit,
                                hasNextPage: false,
                                hasPrevPage: false
                            }
                        }
                    }).send(res);
                }
                const styleIds = getStyles.map(s => s.id);
                where.styles = {
                    some: {
                        styleId: { in: styleIds }
                    }
                };
            }
            where.OR = [
                { styles: { some: { styleId: { in: stylesArray } } } },
                { styles: { some: { style: { slug: { in: stylesArray } } } } }
            ]
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
        }

        const [products, totalCount] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    price: true,
                    stock: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    styles: {
                        select: {
                            style: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true
                                }
                            }
                        }
                    },
                    images: {
                        where: { variantId: null },
                        orderBy: [
                            { isMain: 'desc' },
                            { sortOrder: 'asc' }
                        ],
                        select: {
                            id: true,
                            url: true,
                            alt: true
                        },
                        take: 1
                    },
                    _count: {
                        select: {
                            variants: {
                                where: {
                                    isPublished: true,
                                    isDeleted: false
                                }
                            }
                        }
                    },
                    createdAt: true
                }
            }),
            prisma.product.count({ where })
        ]);

        const formattedProducts = products.map(product => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category,
            styles: product.styles.map(ps => ps.style),
            mainImage: product.images[0] || null,
            variantCount: product._count.variants,
            createdAt: product.createdAt
        }));

        const totalPages = Math.ceil(totalCount / limit);

        return new OK({
            message: 'Get products successfully',
            metadata: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                },
                products: formattedProducts
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getProductBySlugClient = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const product = await prisma.product.findUnique({
            where: { slug, isPublished: true, isDeleted: false },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                price: true,
                stock: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                styles: {
                    select: {
                        style: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                description: true
                            }
                        }
                    }
                },
                images: {
                    where: { variantId: null },
                    orderBy: [
                        { isMain: 'desc' },
                        { sortOrder: 'asc' }
                    ],
                    select: {
                        id: true,
                        url: true,
                        alt: true,
                        sortOrder: true
                    }
                },
                variants: {
                    where: {
                        isPublished: true,
                        isDeleted: false
                    },
                    orderBy: [
                        { price: 'asc' },
                        { createdAt: 'asc' }
                    ],
                    select: {
                        id: true,
                        sku: true,
                        price: true,
                        stock: true,
                        color: {
                            select: {
                                id: true,
                                name: true,
                                hex: true
                            }
                        },
                        Size: {
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
                                sortOrder: true
                            }
                        }
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });
        if (!product) throw new NotFoundError('Product not found');

        const variantsByColor = {};
        const availableColors = [];
        const availableSizes = [];

        product.variants.forEach(variant => {
            // unique colors
            if (variant.color && !availableColors.find(c => c.id === variant.color.id)) {
                availableColors.push(variant.color);
            }

            // unique sizes
            if (variant.size && !availableSizes.find(s => s.id === variant.size.id)) {
                availableSizes.push(variant.size);
            }

            // nhom color
            const colorId = variant.color?.id || 'no-color';
            if (!variantsByColor[colorId]) {
                variantsByColor[colorId] = {
                    color: variant.color,
                    variants: []
                };
            }
            variantsByColor[colorId].variants.push(variant);
        });

        const formattedProduct = {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category,
            styles: product.styles.map(ps => ps.style),
            images: product.images,
            variants: product.variants.map(variant => ({
                id: variant.id,
                sku: variant.sku,
                price: variant.price,
                stock: variant.stock,
                color: variant.color,
                size: variant.Size,
                images: variant.images
            })),
            variantsByColor: Object.values(variantsByColor),
            availableColors,
            availableSizes,
            summary: {
                totalVariants: product.variants.length,
                inStock: product.stock > 0 || product.variants.some(v => v.stock > 0),
                totalStock: product.stock + product.variants.reduce((sum, v) => sum + v.stock, 0),
                priceRange: {
                    min: Math.min(
                        product.price),
                    ...product.variants.map(v => v.price),
                    max: Math.max(
                        product.price),
                    ...product.variants.map(v => v.price)
                },
                hasMultiplePrices: product.variants.length > 0 &&
                    product.variants.some(v => v.price) !== product.price
            },
            createdAt: product.createdAt,
            updatedAt: product.updatedAt
        };

        return new OK({
            message: 'Get product successfully',
            metadata: formattedProduct
        }).send(res);
    } catch (error) {
        console.log(error);
        next(error);
    }
}

module.exports = {
    createProduct,
    getProductByIdAdmin,
    updateProduct,
    uploadProductImages,
    getProductImages,
    updateProductImage,
    deleteProductImage,
    bulkDeleteProductImages,
    reorderProductImages,
    getAllProductsAdmin,
    softDeleteProduct,
    restoreProduct,
    permanentDeleteProduct,

    getAllProductsClient,
    getProductBySlugClient,
    getProductBySlugClient
}