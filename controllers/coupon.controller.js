const { PrismaClient } = require('@prisma/client');
const { createCouponSchema, getAllCouponsSchema, updateCouponSchema, validateCouponSchema, getAvailableCouponsSchema } = require('../middlewares/validations/coupon.validation');
const { ConflictRequestError, BadRequestError, NotFoundError } = require('../utils/core/errorResponse');
const { Created, OK } = require('../utils/core/successResponse');
const { validate } = require('../utils/validateSchema');
const prisma = new PrismaClient();

const getCouponStatus = (startDate, endDate) => {
    const now = Date.now();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (now > end) return 'EXPIRED';
    if (now < start) return 'UPCOMING';
    return 'ONGOING';
};

const getRemainingUsage = (limit, used) => {
    if (limit == null) return null;
    return Math.max(limit - used, 0);
};

const createCoupon = async (req, res, next) => {
    try {
        const value = validate(createCouponSchema, req.body);

        const {
            code, name, description, type, value: couponValue,
            minOrderAmount, maxDiscount, usageLimit,
            perUserLimit, startDate, endDate
        } = value;

        const existingCoupon = await prisma.coupon.findUnique({
            where: { code }
        });
        if (existingCoupon) {
            throw new ConflictRequestError('Coupon code already exists');
        }

        const newCoupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                name,
                description: description || null,
                type,
                value: couponValue,
                minOrderAmount: minOrderAmount || null,
                maxDiscount: maxDiscount || null,
                usageLimit: usageLimit || null,
                perUserLimit: perUserLimit || null,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: true
            },
            select: {
                id: true,
                code: true,
                name: true,
                description: true,
                type: true,
                value: true,
                minOrderAmount: true,
                maxDiscount: true,
                usageLimit: true,
                usageCount: true,
                perUserLimit: true,
                startDate: true,
                endDate: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return new Created({
            message: 'Coupon created successfully',
            metadata: newCoupon
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getAllCoupons = async (req, res, next) => {
    try {
        const value = validate(getAllCouponsSchema, req.query);

        const { page, limit, sortBy, sortOrder, type, isActive, search } = value;
        const skip = (page - 1) * limit;

        const where = {};

        if (type) where.type = type;
        if (isActive !== undefined) where.isActive = isActive;
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } }
            ];
        }
        const orderBy = { [sortBy]: sortOrder };

        const [coupons, totalCount] = await Promise.all([
            prisma.coupon.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: {
                    id: true,
                    code: true,
                    name: true,
                    description: true,
                    type: true,
                    value: true,
                    minOrderAmount: true,
                    maxDiscount: true,
                    usageLimit: true,
                    usageCount: true,
                    perUserLimit: true,
                    startDate: true,
                    endDate: true,
                    isActive: true,
                    _count: {
                        select: { orders: true }
                    },
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.coupon.count({ where })
        ]);

        const formattedCoupons = coupons.map(coupon => {
            return {
                id: coupon.id,
                code: coupon.code,
                name: coupon.name,
                description: coupon.description,
                type: coupon.type,
                value: coupon.value,
                minOrderAmount: coupon.minOrderAmount,
                maxDiscount: coupon.maxDiscount,
                usageLimit: coupon.usageLimit,
                usageCount: coupon.usageCount,
                remainingUsage: getRemainingUsage(coupon.usageLimit, coupon.usageCount),
                perUserLimit: coupon.perUserLimit,
                startDate: coupon.startDate,
                endDate: coupon.endDate,
                isActive: coupon.isActive,
                status: getCouponStatus(coupon.startDate, coupon.endDate),
                orderCount: coupon._count.orders,
                createdAt: coupon.createdAt,
                updatedAt: coupon.updatedAt
            };
        });

        const totalPages = Math.ceil(totalCount / limit);

        const statistics = await prisma.coupon.aggregate({
            where,
            _sum: {
                usageCount: true
            },
            _count: {
                id: true
            }
        });

        return new OK({
            message: 'Get coupons successfully',
            metadata: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                },
                statistics: {
                    totalCoupons: statistics._count.id,
                    totalUsage: statistics._sum.usageCount || 0
                },
                coupons: formattedCoupons,
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getCouponByIdAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;

        const coupon = await prisma.coupon.findUnique({
            where: { id },
            select: {
                id: true,
                code: true,
                name: true,
                description: true,
                type: true,
                value: true,
                minOrderAmount: true,
                maxDiscount: true,
                usageLimit: true,
                usageCount: true,
                perUserLimit: true,
                startDate: true,
                endDate: true,
                isActive: true,
                _count: {
                    select: { orders: true }
                },
                createdAt: true,
                updatedAt: true
            }
        });
        if (!coupon) throw new NotFoundError('Coupon not found');

        const formattedCoupon = {
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            description: coupon.description,
            type: coupon.type,
            value: coupon.value,
            minOrderAmount: coupon.minOrderAmount,
            maxDiscount: coupon.maxDiscount,
            usageLimit: coupon.usageLimit,
            usageCount: coupon.usageCount,
            remainingUsage: getRemainingUsage(coupon.usageLimit, coupon.usageCount),
            perUserLimit: coupon.perUserLimit,
            startDate: coupon.startDate,
            endDate: coupon.endDate,
            isActive: coupon.isActive,
            status: getCouponStatus(coupon.startDate, coupon.endDate),
            orderCount: coupon._count.orders,
            createdAt: coupon.createdAt,
            updatedAt: coupon.updatedAt
        };

        return new OK({
            message: 'Get coupon successfully',
            metadata: formattedCoupon
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const updateCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;

        const value = validate(updateCouponSchema, req.body);

        const existingCoupon = await prisma.coupon.findUnique({
            where: { id },
            select: {
                id: true,
                code: true,
                startDate: true,
                endDate: true,
                usageCount: true
            }
        });
        if (!existingCoupon) throw new NotFoundError('Coupon not found');

        // check neu chi cap nhat endDate
        if (value.endDate && !value.startDate) {
            if (new Date(value.endDate) <= new Date(existingCoupon.startDate)) {
                throw new BadRequestError('End date must be after start date');
            }
        }

        // check neu chi cap nha startDate
        if (value.startDate && !value.endDate) {
            if (new Date(value.startDate) >= new Date(existingCoupon.endDate)) {
                throw new BadRequestError('Start date must be before end date');
            }
        }

        if (value.usageLimit !== undefined && value.usageLimit !== null) {
            if (value.usageLimit < existingCoupon.usageCount) {
                throw new BadRequestError(
                    `Usage limit cannot be less than current usage count (${existingCoupon.usageCount})`
                );
            }
        }

        const updateData = {};

        if (value.name !== undefined) updateData.name = value.name;
        if (value.description !== undefined) updateData.description = value.description || null;
        if (value.type !== undefined) updateData.type = value.type;
        if (value.value !== undefined) updateData.value = value.value;
        if (value.minOrderAmount !== undefined) updateData.minOrderAmount = value.minOrderAmount || null;
        if (value.maxDiscount !== undefined) updateData.maxDiscount = value.maxDiscount || null;
        if (value.usageLimit !== undefined) updateData.usageLimit = value.usageLimit || null;
        if (value.perUserLimit !== undefined) updateData.perUserLimit = value.perUserLimit || null;
        if (value.startDate !== undefined) updateData.startDate = new Date(value.startDate);
        if (value.endDate !== undefined) updateData.endDate = new Date(value.endDate);
        if (value.isActive !== undefined) updateData.isActive = value.isActive;

        const updatedCoupon = await prisma.coupon.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                code: true,
                name: true,
                description: true,
                type: true,
                value: true,
                minOrderAmount: true,
                maxDiscount: true,
                usageLimit: true,
                usageCount: true,
                perUserLimit: true,
                startDate: true,
                endDate: true,
                isActive: true,
                _count: {
                    select: { orders: true }
                },
                createdAt: true,
                updatedAt: true
            }
        });

        const formattedCoupon = {
            id: updatedCoupon.id,
            code: updatedCoupon.code,
            name: updatedCoupon.name,
            description: updatedCoupon.description,
            type: updatedCoupon.type,
            value: updatedCoupon.value,
            minOrderAmount: updatedCoupon.minOrderAmount,
            maxDiscount: updatedCoupon.maxDiscount,
            usageLimit: updatedCoupon.usageLimit,
            usageCount: updatedCoupon.usageCount,
            remainingUsage: getRemainingUsage(updatedCoupon.usageLimit, updatedCoupon.usageCount),
            perUserLimit: updatedCoupon.perUserLimit,
            startDate: updatedCoupon.startDate,
            endDate: updatedCoupon.endDate,
            isActive: updatedCoupon.isActive,
            status: getCouponStatus(updatedCoupon.startDate, updatedCoupon.endDate),
            orderCount: updatedCoupon._count.orders,
            createdAt: updatedCoupon.createdAt,
            updatedAt: updatedCoupon.updatedAt
        };

        return new OK({
            message: 'Coupon updated successfully',
            metadata: formattedCoupon
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const deleteCoupon = async (req, res, next) => {
    try {
        const { id } = req.params;

        const coupon = await prisma.coupon.findUnique({
            where: { id },
            select: {
                id: true,
                code: true,
                _count: {
                    select: { orders: true }
                }
            }
        });
        if (!coupon) throw new NotFoundError('Coupon not found');


        // neu coupon da su dung thi khong the xoa
        if (coupon._count.orders > 0) {
            throw new BadRequestError(
                `Cannot delete coupon that has been used in ${coupon._count.orders} order(s). Please deactivate it instead.`
            );
        }

        await prisma.coupon.delete({
            where: { id }
        });

        return new OK({
            message: 'Coupon deleted successfully'
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const validateCoupon = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { code, orderTotal } = validate(validateCouponSchema, req.body);

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
            select: {
                id: true,
                code: true,
                name: true,
                description: true,
                type: true,
                value: true,
                minOrderAmount: true,
                maxDiscount: true,
                usageLimit: true,
                usageCount: true,
                perUserLimit: true,
                startDate: true,
                endDate: true,
                isActive: true
            }
        });
        if (!coupon) throw new NotFoundError('Coupon not found');

        const errors = [];
        const now = new Date();

        // check if active
        if (!coupon.isActive) errors.push('Coupon is not active');
        // check if started
        if (now < new Date(coupon.startDate)) {
            errors.push('Coupon has not started yet');
        }
        // check if expired
        if (now > new Date(coupon.endDate)) {
            errors.push('Coupon has expired');
        }
        // check usage limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            errors.push('Coupon usage limit reached');
        }
        // check min order amount
        if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
            errors.push(`Order total must be at least ${coupon.minOrderAmount.toLocaleString('vi-VN')} VND`);
        }
        // check per user limit
        if (coupon.perUserLimit) {
            const userUsageCount = await prisma.order.count({
                where: {
                    userId,
                    couponId: coupon.id
                }
            });

            if (userUsageCount >= coupon.perUserLimit) {
                errors.push(`You have already used this coupon ${coupon.perUserLimit} time(s)`);
            }
        }
        // if has errors, return validation failed
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Coupon validation failed',
                    errors
                }
            });
        }

        // calculate discount
        let discountAmount = 0;

        if (coupon.type === 'PERCENT') {
            discountAmount = Math.floor((orderTotal * coupon.value) / 100);
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else if (coupon.type === 'AMOUNT') {
            discountAmount = coupon.value;
            if (discountAmount > orderTotal) {
                discountAmount = orderTotal;
            }
        } else if (coupon.type === 'FREE_SHIPPING') {
            discountAmount = 0;
        }

        const finalTotal = orderTotal - discountAmount;

        return new OK({
            message: 'Coupon is valid',
            metadata: {
                isValid: true,
                coupon: {
                    id: coupon.id,
                    code: coupon.code,
                    name: coupon.name,
                    description: coupon.description,
                    type: coupon.type,
                    value: coupon.value
                },
                discount: {
                    amount: discountAmount,
                    type: coupon.type
                },
                orderSummary: {
                    subtotal: orderTotal,
                    discountAmount: discountAmount,
                    total: finalTotal
                }
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getAvailableCoupons = async (req, res, next) => {
    try {
        const { page, limit, type } = validate(getAvailableCouponsSchema, req.query);

        const skip = (page - 1) * limit;

        const now = new Date();
        const where = {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now }
        };

        if (type) where.type = type;

        const [coupons, totalCount] = await Promise.all([
            prisma.coupon.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    code: true,
                    name: true,
                    description: true,
                    type: true,
                    value: true,
                    minOrderAmount: true,
                    maxDiscount: true,
                    usageLimit: true,
                    usageCount: true,
                    perUserLimit: true,
                    endDate: true,
                    createdAt: true
                }
            }),
            prisma.coupon.count({ where })
        ]);

        const availableCoupons = coupons.filter(c =>
            c.usageLimit == null || c.usageCount < c.usageLimit
        );

        const formattedCoupons = availableCoupons.map(coupon => {
            return {
                id: coupon.id,
                code: coupon.code,
                name: coupon.name,
                description: coupon.description,
                type: coupon.type,
                value: coupon.value,
                minOrderAmount: coupon.minOrderAmount,
                maxDiscount: coupon.maxDiscount,
                remainingUsage: getRemainingUsage(coupon.usageLimit, coupon.usageCount),
                perUserLimit: coupon.perUserLimit,
                expiresAt: coupon.endDate,
                createdAt: coupon.createdAt
            };
        });

        const totalPages = Math.ceil(availableCoupons.length / limit);

        return new OK({
            message: 'Get available coupons successfully',
            metadata: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount: availableCoupons.length,
                    limit,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                },
                coupons: formattedCoupons
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCoupon,
    getAllCoupons,
    getCouponByIdAdmin,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    getAvailableCoupons
}