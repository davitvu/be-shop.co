const { PrismaClient } = require('@prisma/client');
const { createReviewSchema, getReviewsSchema, updateReviewSchema, getFeaturedReviewsSchema } = require('../middlewares/validations/review.validation');
const { BadRequestError, NotFoundError, ConflictRequestError } = require('../utils/core/errorResponse');
const { Created, OK } = require('../utils/core/successResponse');
const prisma = new PrismaClient();
const { validate } = require('../utils/validateSchema');

const createReview = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { error, value } = createReviewSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { productId, orderId, rating, comment } = value;

        let newReview;

        await prisma.$transaction(async (tx) => {
            // 1. lay san pham
            const product = tx.product.findFirst({
                where: { id: productId, isDeleted: false, isPublished: true },
                select: { id: true, name: true, slug: true }
            });
            if (!product) throw new NotFoundError("Product not found or not available");


            // 2. lay order de xac minh
            const order = await tx.order.findUnique({
                where: { id: orderId },
                select: {
                    id: true,
                    orderNumber: true,
                    userId: true,
                    status: true,
                    items: {
                        select: {
                            productId: true
                        }
                    }
                }
            });
            if (!order) throw new NotFoundError("Order not found");

            // xac minh la nguoi mua hang
            if (order.userId !== userId) {
                throw new BadRequestError("This order does not belong to you");
            }

            // xac minh la don hang da duoc giao
            if (order.status !== 'DELIVERED') {
                throw new BadRequestError("You can only review products from delivered orders");
            }

            // xac minh san pham nay nam trong order da mua
            const productInOrder = order.items.some(item => item.productId === productId);
            if (!productInOrder) {
                throw new BadRequestError('This product is not in your order');
            }

            // kiem tra user da danh gia san pham nay trong order nay chua
            const existingReview = await tx.review.findUnique({
                where: {
                    userId_orderId_productId: {
                        userId, orderId, productId
                    }
                }
            });
            if (existingReview) {
                throw new ConflictRequestError('You have already reviewed this product in this order');
            }

            // 3. tao review
            newReview = await tx.review.create({
                data: {
                    userId,
                    orderId,
                    productId,
                    rating,
                    comment
                },
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    },
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    order: {
                        select: {
                            id: true,
                            orderNumber: true
                        }
                    },
                    createdAt: true,
                    updatedAt: true
                }
            });
        });

        const formattedReview = {
            id: newReview.id,
            rating: newReview.rating,
            comment: newReview.comment,
            user: {
                id: newReview.user.id,
                name: `${newReview.user.firstName || ''} ${newReview.user.lastName || ''}`.trim() || 'Anonymous'
            },
            product: newReview.product,
            order: newReview.order,
            createdAt: newReview.createdAt,
            updatedAt: newReview.updatedAt
        };

        return new Created({
            message: 'Review created successfully',
            data: formattedReview
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getReviewsByProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;

        const { error, value } = getReviewsSchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { page, limit, sortBy, sortOrder, rating } = value;
        const skip = (page - 1) * limit;

        // check product exists
        const product = await prisma.product.findUnique({
            where: { id: productId, isDeleted: false, isPublished: true },
            select: { id: true, name: true, slug: true }
        });
        if (!product) {
            throw new NotFoundError('Product not found or not available');
        }

        const where = { productId };
        const orderBy = { [sortBy]: sortOrder };

        if (rating) where.rating = rating;

        const [reviews, totalCount, ratingStats] = await Promise.all([
            prisma.review.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    },
                    order: {
                        select: {
                            id: true,
                            orderNumber: true
                        }
                    },
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.review.count({ where }),
            // rating statistics
            prisma.review.groupBy({
                by: ['rating'],
                where: { productId },
                _count: {
                    rating: true
                }
            })
        ]);

        const formattedReviews = reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            user: {
                id: review.user.id,
                name: `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || 'Anonymous'
            },
            order: review.order,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt
        }));

        const totalReviews = await prisma.review.count({
            where: { productId }
        });

        const ratingMap = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };

        let totalRatingSum = 0;

        ratingStats.forEach(stat => {
            ratingMap[stat.rating] = stat._count.rating;
            totalRatingSum += stat.rating * stat._count.rating;
        });

        const averageRating = totalReviews > 0
            ? parseFloat((totalRatingSum / totalReviews).toFixed(1))
            : 0;

        const totalPages = Math.ceil(totalCount / limit);

        return new OK({
            message: 'Get reviews successfully',
            data: {
                product,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                },
                statistics: {
                    totalReviews,
                    averageRating,
                    ratingMap
                },
                reviews: formattedReviews
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getUserReviews = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { error, value } = getReviewsSchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { page, limit, sortBy, sortOrder, rating } = value;
        const skip = (page - 1) * limit;

        const where = { userId };
        const orderBy = { [sortBy]: sortOrder };

        if (rating) where.rating = rating;

        const [reviews, totalCount] = await Promise.all([
            prisma.review.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            images: {
                                where: { isMain: true },
                                take: 1,
                                select: {
                                    url: true
                                }
                            }
                        }
                    },
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                            createdAt: true
                        }
                    },
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.review.count({ where })
        ]);
        const formattedReviews = reviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            product: {
                id: review.product.id,
                name: review.product.name,
                slug: review.product.slug,
                imageUrl: review.product.images[0]?.url || null
            },
            order: review.order,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt
        }));

        const totalPages = Math.ceil(totalCount / limit);

        return new OK({
            message: 'Get user reviews successfully',
            data: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                },
                reviews: formattedReviews,

            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const updateReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { error, value } = updateReviewSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        const { rating, commnet } = value;

        const review = await prisma.review.findUnique({
            where: { id },
            select: {
                id: true,
                userId: true
            }
        });
        if (!review) throw new NotFoundError('Review not found');
        if (review.userId !== userId) throw new BadRequestError('This review does not belong to you');

        const updatedReview = await prisma.review.update({
            where: { id },
            data: value,
            select: {
                id: true,
                rating: true,
                comment: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true
                    }
                },
                order: {
                    select: {
                        id: true,
                        orderNumber: true
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });

        const formattedReview = {
            id: updatedReview.id,
            rating: updatedReview.rating,
            comment: updatedReview.comment,
            user: {
                id: updatedReview.user.id,
                name: `${updatedReview.user.firstName || ''} ${updatedReview.user.lastName || ''}`.trim() || 'Anonymous'
            },
            product: updatedReview.product,
            order: updatedReview.order,
            createdAt: updatedReview.createdAt,
            updatedAt: updatedReview.updatedAt
        };

        return new OK({
            message: 'Review updated successfully',
            data: formattedReview
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const review = await prisma.review.findUnique({
            where: { id },
            select: {
                id: true,
                userId: true
            }
        });
        if (!review) throw new NotFoundError('Review not found');
        if (review.userId !== userId) {
            throw new BadRequestError('This review does not belong to you');
        }

        await prisma.review.delete({
            where: { id }
        });

        return new OK({
            message: 'Review deleted successfully'
        }).send(res);
    } catch (error) {
        next(error);
    }
}

const getFeaturedReviews = async (req, res, next) => {
    try {
        const { limit, minRating } = validate(getFeaturedReviewsSchema, req.query);

        const reviews = await prisma.review.findMany({
            where: {
                rating: { gte: minRating },
                comment: { not: '' }
            },
            orderBy: [
                { rating: 'desc' },
                { createdAt: 'desc' }
            ],
            take: limit * 2, // Get more to filter
            select: {
                id: true,
                rating: true,
                comment: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true
                    }
                },
                createdAt: true
            }
        });

        const meaningfulReviews = reviews
            .filter(review => review.comment.length >= 10)
            .slice(0, limit);

        const formattedReviews = meaningfulReviews.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            customer: {
                id: review.user.id,
                name: `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || 'Anonymous',
                avatar: review.user.avatarUrl || null,
                initials: getInitials(review.user.firstName, review.user.lastName)
            },
            createdAt: review.createdAt,
            verifiedPurchase: true // All reviews in system are from delivered orders
        }));

        return new OK({
            message: 'Get featured reviews successfully',
            data: {
                total: formattedReviews.length,
                reviews: formattedReviews,
            }
        }).send(res);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return (first + last) || 'AN';
};

module.exports = {
    createReview,
    getReviewsByProduct,
    getUserReviews,
    updateReview,
    deleteReview,
    getFeaturedReviews
};