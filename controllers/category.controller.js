const { PrismaClient } = require('@prisma/client');
const { createCategorySchema, getAllCategoriesSchema, updateCategorySchema } = require('../middlewares/validations/category.validation');
const { BadRequestError, ConflictRequestError, NotFoundError } = require('../utils/core/errorResponse');
const { Created, OK } = require('../utils/core/successResponse');
const { CATEGORY_PUBLIC_SELECT, CATEGORY_WITH_PRODUCTS_SELECT, CATEGORY_WITH_DELETED_SELECT, CATEGORY_WITH_PRODUCTS_DELETED_SELECT } = require('../prisma/constants/category-selects');
const { generateSlugAndCheckExists } = require('../utils/generateSlug');
const prisma = new PrismaClient();

// ==================== CLIENT APIS ====================
const getAllCategoriesClient = async (req, res, next) => {
    try {
        const { error, value } = getAllCategoriesSchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const {
            page, limit, sortBy, sortOrder, search,
            isPublished, createdFrom, createdTo,
            updatedFrom, updatedTo } = value;

        const skip = (page - 1) * limit;

        // mặc định chỉ lấy ra các category chưa xoá
        const where = {
            isDeleted: false
        };

        // search
        if (search && search.trim()) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ]
        }

        // isPublished
        if (isPublished !== undefined) where.isPublished = isPublished;

        // orderby
        const orderBy = { [sortBy]: sortOrder };

        // date range
        if (createdFrom || createdTo) {
            where.createdAt = {};
            if (createdFrom) where.createdAt.gte = new Date(createdFrom);
            if (createdTo) where.createdAt.lte = new Date(createdTo);
        }
        if (updatedFrom || updatedTo) {
            where.updatedAt = {};
            if (updatedFrom) where.createdAt.gte = new Date(updatedFrom);
            if (updatedTo) where.createdAt.lte = new Date(updatedTo);
        }

        const [categories, totalCount] = await Promise.all([
            prisma.category.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: CATEGORY_PUBLIC_SELECT
            }),
            prisma.category.count({ where })
        ])

        const totalPages = Math.ceil(totalCount / limit);

        return new OK({
            message: 'Get categories successfully',
            metadata: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                },
                categories
            }
        }).send(res);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

// ==================== ADMIN APIS ====================
const getAllCategoriesAdmin = async (req, res, next) => {
    try {
        const { error, value } = getAllCategoriesSchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const {
            page, limit, sortBy, sortOrder, search, isPublished,
            isDeleted, includeProducts, createdFrom, createdTo,
            updatedFrom, updatedTo, deletedFrom, deletedTo
        } = value;

        const skip = (page - 1) * limit;

        const where = {};
        // sortOrder
        const orderBy = { [sortBy]: sortOrder };

        if (search && search.trim()) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
            ];
        }

        // isPublished
        if (isPublished !== undefined) where.isPublished = isPublished;

        // isDeleted
        if (isDeleted !== undefined) where.isDeleted = isDeleted;

        // date range filter
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

        const [categories, totalCount] = await Promise.all([
            prisma.category.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: includeProducts ? CATEGORY_WITH_PRODUCTS_DELETED_SELECT : CATEGORY_WITH_DELETED_SELECT
            }),
            prisma.category.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return new OK({
            message: 'Get categories successfully',
            metadata: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasPrevPage,
                    hasNextPage,
                },
                categories
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { includeProducts = false } = req.query;

        const category = await prisma.category.findUnique({
            where: { id },
            select: includeProducts ? CATEGORY_WITH_PRODUCTS_DELETED_SELECT : CATEGORY_WITH_DELETED_SELECT
        });
        if (!category) throw new NotFoundError('Category not found');

        return new OK({
            message: 'Get category successfully',
            metadata: {
                category,
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getCategoryBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { includeProducts = false } = req.query;

        const category = await prisma.category.findUnique({
            where: { slug },
            select: includeProducts ? CATEGORY_WITH_PRODUCTS_SELECT : CATEGORY_PUBLIC_SELECT
        });
        if (!category) throw new NotFoundError('Category not found');

        return new OK({
            message: 'Get category successfully',
            metadata: {
                category,
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const createCategory = async (req, res, next) => {
    try {
        const { error } = createCategorySchema.validate({ ...req.body, slug }, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            return next(createError(400, errorMessages))
        }

        const { name, slug } = value;

        let newCagegory;
        await prisma.$transaction(async (tx) => {
            const genSlug = await generateSlugAndCheckExists(name, async (slug) => {
                return await tx.category.findFirst({
                    where: { slug }
                });
            });
            if (!genSlug) throw new ConflictRequestError('Slug already exists');

            newCagegory = await tx.category.create({
                data: { name, slug, ...value }
            });
        });

        return new Created({
            message: "Create category successfully",
            metadata: {
                newCagegory
            }
        }).send(res);
    } catch (error) {
        // Handle unique constraint error
        if (error.code === 'P2002') {
            return next(new ConflictRequestError('Category with this name already exists'));
        }
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { error, value } = updateCategorySchema.validate({ ...req.body, id }, {
            abortEarly: false,
            stripUnknown: true
        });
        console.log(value);

        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        await prisma.$transaction(async (tx) => {
            const category = await tx.category.findFirst({
                where: {
                    id: { not: id },
                    isDeleted: false
                }
            });
            if (!category) throw new NotFoundError('Category not found');

            if (value.name) {
                const genSlug = await generateSlugAndCheckExists(value.name, async (slug) => {
                    return await tx.category.findFirst({
                        where: {
                            id: { not: id },
                            slug
                        }
                    })
                })
                if (!genSlug) throw new ConflictRequestError('Slug already exists');
            }

            await tx.category.update({
                where: { id },
                data: value
            })
        });

        return new OK({
            message: 'Category updated successfully',
        }).send(res);
    } catch (error) {
        if (error.code === 'P2002') {
            return next(new ConflictRequestError('Category with this name already exists'));
        }
        next(error);
    }
};

const softDeleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (tx) => {
            const category = await tx.category.findUnique({
                where: { id, isDeleted: false },
                include: {
                    _count: {
                        select: { products: true }
                    }
                }
            });
            if (!category) throw new NotFoundError('Category not found or already deleted');
            if (category._count.products > 0) {
                throw new BadRequestError(
                    `Cannot delete category with ${category._count.products} product(s). Please reassign or delete products first.`
                );
            }

            await tx.category.update({
                where: { id },
                data: {
                    isDeleted: true,
                    isPublished: false,
                    deletedAt: new Date()
                }
            })
        });

        return new OK({
            message: 'Category deleted successfully'
        }).send(res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCategory,
    getAllCategoriesClient,
    getCategoryById,
    getCategoryBySlug,
    getAllCategoriesAdmin,
    updateCategory,
    softDeleteCategory
}