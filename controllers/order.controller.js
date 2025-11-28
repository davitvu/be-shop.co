const { PrismaClient } = require('@prisma/client');
const { createOrderSchema, getAllUserOrderSchema, cancelOrderSchema, getAllOrdersAdminSchema, updateOrderStatusSchema } = require('../middlewares/validations/order.validation');
const { generateOrderNumber } = require('../utils/generateOrderNumber');
const { BadRequestError, NotFoundError } = require('../utils/core/errorResponse');
const { Created, OK } = require('../utils/core/successResponse');
const prisma = new PrismaClient();

const createOrder = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { error, value } = createOrderSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { addressId, paymentMethod, notes } = value;

        let newOrder;

        await prisma.$transaction(async (tx) => {
            // 1. get user cart with item
            const cart = await tx.cart.findUnique({
                where: { userId },
                include: {
                    items: {
                        include: {
                            variant: {
                                include: {
                                    product: true,
                                    color: true,
                                    size: true,
                                    images: {
                                        where: { isMain: true },
                                        take: 1
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!cart || cart.items.length === 0) {
                throw new BadRequestError('Cart is empty');
            }

            // 2. get shipping address
            const address = await tx.address.findUnique({
                where: { id: addressId }
            });
            if (!address) throw new NotFoundError('Address not found');
            if (address.userId !== userId) {
                throw new BadRequestError('This address does not belong to you');
            }

            // 3. validate all item and calculate totals
            let subtotal = 0;
            const orderItems = [];

            for (const cartItem of cart.items) {
                const variant = cartItem.variant;

                // check variant
                if (variant.isDeleted && !variant.isPublished) {
                    throw new BadRequestError(`Product "${variant.product.name}" is no longer available`);
                }

                // check product
                if (variant.product.isDeleted && !variant.product.isDeleted) {
                    throw new BadRequestError(`Product "${variant.product.name}" is no longer available`);
                }

                // check stock
                if (variant.stock < cartItem.quantity) {
                    throw new BadRequestError(
                        `Not enough stock for "${variant.product.name}". Only ${variant.stock} available`
                    );
                }

                // tinh tong tien cua item
                const itemSubtotal = variant.price * cartItem.quantity;
                subtotal += itemSubtotal;

                // data cua orderItem (snapshot)
                orderItems.push({
                    productId: variant.product.id,
                    productName: variant.product.name,
                    productSlug: variant.product.slug,
                    variantId: variant.id,
                    variantSku: variant.sku,
                    colorName: variant.color?.name,
                    colorHex: variant.color?.hex,
                    sizeName: variant.size?.name,
                    sizeValue: variant.size?.value,
                    imageUrl: variant.images[0]?.url,
                    price: variant.price,
                    quantity: cartItem.quantity,
                    subtotal: itemSubtotal
                });

                // giam so luong ben variant
                await tx.productVariant.update({
                    where: { id: variant.id },
                    data: {
                        stock: { decrement: cartItem.quantity }
                    }
                });

                // giam so luong ben product
                await tx.product.update({
                    where: { id: variant.product.id },
                    data: {
                        stock: {
                            decrement: cartItem.quantity
                        }
                    }
                });
            }

            // 4. tinh phi va tong tien
            const shippingFee = 3000;
            const tax = 0;
            const discount = 0;
            const total = subtotal + shippingFee + tax + discount;

            // 5. generate
            const orderNumber = await generateOrderNumber();

            newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    userId,
                    // shipping address snapshot
                    shippingName: `${address.firstName} ${address.lastName}`,
                    shippingPhone: address.phone,
                    shippingAddress: address.address,
                    shippingWard: address.ward,
                    shippingDistrict: address.district,
                    shippingCity: address.city,
                    // order details
                    subtotal,
                    shippingFee,
                    tax,
                    discount,
                    total,
                    // payment
                    paymentMethod,
                    paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
                    // status
                    status: 'PENDING',
                    // notes
                    notes,
                    // order items
                    items: {
                        create: orderItems
                    }
                },
                include: {
                    items: true
                }
            });

            // 7. clear cart after successful order
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id }
            })
        });

        const formattedOrder = {
            id: newOrder.id,
            orderNumber: newOrder.orderNumber,
            status: newOrder.status,
            paymentMethod: newOrder.paymentMethod,
            paymentStatus: newOrder.paymentStatus,
            shippingAddress: {
                fullName: newOrder.shippingName,
                phone: newOrder.shippingPhone,
                address: newOrder.shippingAddress,
                ward: newOrder.shippingWard,
                district: newOrder.shippingDistrict,
                city: newOrder.shippingCity
            },
            items: newOrder.items.map(item => ({
                id: item.id,
                productName: item.productName,
                productSlug: item.productSlug,
                variantSku: item.variantSku,
                color: item.colorName ? { name: item.colorName, hex: item.colorHex } : null,
                size: item.sizeName ? { name: item.sizeName, value: item.sizeValue } : null,
                imageUrl: item.imageUrl,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.subtotal
            })),
            subtotal: newOrder.subtotal,
            shippingFee: newOrder.shippingFee,
            tax: newOrder.tax,
            discount: newOrder.discount,
            total: newOrder.total,
            notes: newOrder.notes,
            createdAt: newOrder.createdAt
        };

        return new Created({
            message: 'Order created successfully',
            metadata: formattedOrder
        }).send(res);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

const getAllOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { error, value } = getAllUserOrderSchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { page, limit, status, paymentStatus } = value;

        const skip = (page - 1) * limit;

        const where = { userId };

        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;

        const [orders, totalCount] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    shippingName: true,
                    shippingPhone: true,
                    shippingAddress: true,
                    shippingWard: true,
                    shippingDistrict: true,
                    shippingCity: true,
                    subtotal: true,
                    shippingFee: true,
                    tax: true,
                    discount: true,
                    total: true,
                    notes: true,
                    paidAt: true,
                    items: {
                        select: {
                            id: true,
                            productId: true,
                            productName: true,
                            productSlug: true,
                            variantSku: true,
                            colorName: true,
                            colorHex: true,
                            sizeName: true,
                            sizeValue: true,
                            imageUrl: true,
                            price: true,
                            quantity: true,
                            subtotal: true
                        }
                    },
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.order.count({ where })
        ]);

        const formattedOrders = orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            shippingAddress: {
                fullName: order.shippingName,
                phone: order.shippingPhone,
                address: order.shippingAddress,
                ward: order.shippingWard,
                district: order.shippingDistrict,
                city: order.shippingCity
            },
            items: order.items.map(item => ({
                id: item.id,
                productId: item.productId,
                productName: item.productName,
                productSlug: item.productSlug,
                variantSku: item.variantSku,
                color: item.colorName ? { name: item.colorName, hex: item.colorHex } : null,
                size: item.sizeName ? { name: item.sizeName, value: item.sizeValue } : null,
                imageUrl: item.imageUrl,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.subtotal
            })),
            itemCount: order.items.length,
            subtotal: order.subtotal,
            shippingFee: order.shippingFee,
            tax: order.tax,
            discount: order.discount,
            total: order.total,
            notes: order.notes,
            paidAt: order.paidAt,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        }));

        const totalPages = Math.ceil(totalCount / limit);

        return new OK({
            message: 'Get orders successfully',
            metadata: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                },
                orders: formattedOrders
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const order = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                orderNumber: true,
                userId: true,
                status: true,
                paymentMethod: true,
                paymentStatus: true,
                paidAt: true,
                shippingName: true,
                shippingPhone: true,
                shippingAddress: true,
                shippingWard: true,
                shippingDistrict: true,
                shippingCity: true,
                subtotal: true,
                shippingFee: true,
                tax: true,
                discount: true,
                total: true,
                notes: true,
                adminNotes: true,
                items: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        productId: true,
                        productName: true,
                        productSlug: true,
                        variantId: true,
                        variantSku: true,
                        colorName: true,
                        colorHex: true,
                        sizeName: true,
                        sizeValue: true,
                        imageUrl: true,
                        price: true,
                        quantity: true,
                        subtotal: true,
                        createdAt: true
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });
        if (!order) throw new NotFoundError('Order not found');
        if (order.userId !== userId) {
            throw new BadRequestError('This order does not belong to you');
        }

        const formattedOrder = {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            paidAt: order.paidAt,
            shippingAddress: {
                fullName: order.shippingName,
                phone: order.shippingPhone,
                address: order.shippingAddress,
                ward: order.shippingWard,
                district: order.shippingDistrict,
                city: order.shippingCity
            },
            items: order.items.map(item => ({
                id: item.id,
                productId: item.productId,
                productName: item.productName,
                productSlug: item.productSlug,
                variantId: item.variantId,
                variantSku: item.variantSku,
                color: item.colorName ? { name: item.colorName, hex: item.colorHex } : null,
                size: item.sizeName ? { name: item.sizeName, value: item.sizeValue } : null,
                imageUrl: item.imageUrl,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.subtotal,
                createdAt: item.createdAt
            })),
            itemCount: order.items.length,
            subtotal: order.subtotal,
            shippingFee: order.shippingFee,
            tax: order.tax,
            discount: order.discount,
            total: order.total,
            notes: order.notes,
            adminNotes: order.adminNotes,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };

        return new OK({
            message: 'Get order successfully',
            metadata: formattedOrder
        }).send(res);
    } catch (error) {
        next(error)
    }
};

const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const { error, value } = cancelOrderSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { reason } = value;

        let cancelledOrder;

        await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: {
                    items: {
                        select: {
                            variantId: true,
                            productId: true,
                            quantity: true
                        }
                    }
                }
            });
            if (!order) throw new NotFoundError('Order not found');
            if (order.userId !== userId) {
                throw new BadRequestError('This order does not belong to you');
            }
            if (order.status === 'CANCELLED') {
                throw new BadRequestError('Order has already been cancelled');
            }
            if (order.status === 'DELIVERED') {
                throw new BadRequestError('Cannot cancel delivered order. Please request a return instead');
            }
            if (order.status === 'REFUNDED') {
                throw new BadRequestError('Cannot cancel refunded order');
            }
            if (order.status === 'SHIPPING') {
                throw new BadRequestError('Cannot cancel order that is already shipping. Please contact support');
            }

            // khoi phuc stock tat ca item
            for (const item of order.items) {
                // khoi phuc variant stock
                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        stock: {
                            increment: item.quantity
                        }
                    }
                });

                // khoi phuc product stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity }
                    }
                });

                // cap nha trang thai order
                cancelledOrder = await tx.order.update({
                    where: { id },
                    data: {
                        status: 'CANCELLED',
                        notes: order.notes
                            ? `${order.notes}\n\n[CANCELLED] ${reason}`
                            : `[CANCELLED] ${reason}`
                    },
                    select: {
                        id: true,
                        orderNumber: true,
                        status: true,
                        paymentMethod: true,
                        paymentStatus: true,
                        shippingName: true,
                        shippingPhone: true,
                        shippingAddress: true,
                        shippingWard: true,
                        shippingDistrict: true,
                        shippingCity: true,
                        subtotal: true,
                        shippingFee: true,
                        tax: true,
                        discount: true,
                        total: true,
                        notes: true,
                        createdAt: true,
                        updatedAt: true
                    }
                });
            }
        });

        const formattedOrder = {
            id: cancelledOrder.id,
            orderNumber: cancelledOrder.orderNumber,
            status: cancelledOrder.status,
            paymentMethod: cancelledOrder.paymentMethod,
            paymentStatus: cancelledOrder.paymentStatus,
            shippingAddress: {
                fullName: cancelledOrder.shippingName,
                phone: cancelledOrder.shippingPhone,
                address: cancelledOrder.shippingAddress,
                ward: cancelledOrder.shippingWard,
                district: cancelledOrder.shippingDistrict,
                city: cancelledOrder.shippingCity
            },
            subtotal: cancelledOrder.subtotal,
            shippingFee: cancelledOrder.shippingFee,
            tax: cancelledOrder.tax,
            discount: cancelledOrder.discount,
            total: cancelledOrder.total,
            notes: cancelledOrder.notes,
            createdAt: cancelledOrder.createdAt,
            updatedAt: cancelledOrder.updatedAt
        };

        return new OK({
            message: 'Order cancelled successfully',
            metadata: formattedOrder
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getAllOrdersAdmin = async (req, res, next) => {
    try {
        const { error, value } = getAllOrdersAdminSchema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const {
            page, limit, sortBy, sortOrder, status,
            paymentStatus, paymentMethod, search,
            dateFrom, dateTo
        } = value;

        const skip = (page - 1) * limit;

        const where = {};

        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;
        if (paymentMethod) where.paymentMethod = paymentMethod;
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { shippingName: { contains: search, mode: 'insensitive' } },
                { shippingPhone: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                where.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                where.createdAt.lte = endDate;
            }
        }
        const orderBy = { [sortBy]: sortOrder };

        const [orders, totalCount] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: {
                    id: true,
                    orderNumber: true,
                    userId: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    },
                    status: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    paidAt: true,
                    shippingName: true,
                    shippingPhone: true,
                    shippingAddress: true,
                    shippingWard: true,
                    shippingDistrict: true,
                    shippingCity: true,
                    subtotal: true,
                    shippingFee: true,
                    tax: true,
                    discount: true,
                    total: true,
                    notes: true,
                    adminNotes: true,
                    _count: {
                        select: { items: true }
                    },
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.order.count({ where })
        ]);

        const formattedOrders = orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customer: {
                id: order.user.id,
                email: order.user.email,
                name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'N/A'
            },
            status: order.status,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            paidAt: order.paidAt,
            shippingAddress: {
                fullName: order.shippingName,
                phone: order.shippingPhone,
                address: order.shippingAddress,
                ward: order.shippingWard,
                district: order.shippingDistrict,
                city: order.shippingCity
            },
            itemCount: order._count.items,
            subtotal: order.subtotal,
            shippingFee: order.shippingFee,
            tax: order.tax,
            discount: order.discount,
            total: order.total,
            notes: order.notes,
            adminNotes: order.adminNotes,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        }));

        const totalPages = Math.ceil(totalCount / limit);

        const statistics = await prisma.order.aggregate({
            where,
            _sum: {
                total: true
            },
            _count: {
                id: true
            }
        });

        return new OK({
            message: 'Get orders successfully',
            metadata: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                statistics: {
                    totalOrders: statistics._count.id,
                    totalRevenue: statistics._sum.total || 0
                },
                orders: formattedOrders,
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getOrderByIdAdmin = async (req, res, next) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                orderNumber: true,
                userId: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        createdAt: true
                    }
                },
                status: true,
                paymentMethod: true,
                paymentStatus: true,
                paidAt: true,
                shippingName: true,
                shippingPhone: true,
                shippingAddress: true,
                shippingWard: true,
                shippingDistrict: true,
                shippingCity: true,
                subtotal: true,
                shippingFee: true,
                tax: true,
                discount: true,
                total: true,
                notes: true,
                adminNotes: true,
                items: {
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        productId: true,
                        productName: true,
                        productSlug: true,
                        variantId: true,
                        variantSku: true,
                        colorName: true,
                        colorHex: true,
                        sizeName: true,
                        sizeValue: true,
                        imageUrl: true,
                        price: true,
                        quantity: true,
                        subtotal: true,
                        createdAt: true
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });
        if (!order) throw new NotFoundError('Order not found');

        const formattedOrder = {
            id: order.id,
            orderNumber: order.orderNumber,
            customer: {
                id: order.user.id,
                email: order.user.email,
                name: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'N/A',
                phone: order.user.phone,
                memberSince: order.user.createdAt
            },
            status: order.status,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            paidAt: order.paidAt,
            shippingAddress: {
                fullName: order.shippingName,
                phone: order.shippingPhone,
                address: order.shippingAddress,
                ward: order.shippingWard,
                district: order.shippingDistrict,
                city: order.shippingCity
            },
            items: order.items.map(item => ({
                id: item.id,
                productId: item.productId,
                productName: item.productName,
                productSlug: item.productSlug,
                variantId: item.variantId,
                variantSku: item.variantSku,
                color: item.colorName ? { name: item.colorName, hex: item.colorHex } : null,
                size: item.sizeName ? { name: item.sizeName, value: item.sizeValue } : null,
                imageUrl: item.imageUrl,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.subtotal,
                createdAt: item.createdAt
            })),
            itemCount: order.items.length,
            subtotal: order.subtotal,
            shippingFee: order.shippingFee,
            tax: order.tax,
            discount: order.discount,
            total: order.total,
            notes: order.notes,
            adminNotes: order.adminNotes,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
        };

        return new OK({
            message: 'Get order successfully',
            metadata: formattedOrder
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { error, value } = updateOrderStatusSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { status, adminNotes } = value;

        let updatedOrder;

        await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                select: {
                    id: true,
                    status: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    adminNotes: true,
                    items: {
                        select: {
                            variantId: true,
                            productId: true,
                            quantity: true
                        }
                    }
                }
            });
            if (!order) throw new NotFoundError('Order not found');

            // validate status transition
            const currentStatus = order.status.toUpperCase();

            // khong the thay doi status = DELIVERED, CANCELLED, REFUNDED
            if (currentStatus === 'DELIVERED' && status !== 'REFUNDED') {
                throw new BadRequestError('Cannot change status of delivered order except to REFUNDED');
            }
            if (currentStatus === 'CANCELLED') {
                throw new BadRequestError('Cannot change status of cancelled order');
            }
            if (currentStatus === 'REFUNDED') {
                throw new BadRequestError('Cannot change status of refunded order');
            }

            // ngăn quay ngược trạng thái (ngoại trừ CANCELLED và REFUNDED)
            const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED'];
            const currentIndex = statusOrder.indexOf(currentStatus);
            const newIndex = statusOrder.indexOf(status);

            if (status !== 'CANCELLED' && status !== 'REFUNDED') {
                if (newIndex < currentIndex) {
                    throw new BadRequestError(`Cannot change status from ${currentStatus} to ${status}`);
                }
            }
            if (status === 'CANCELLED' && currentStatus === 'SHIPPING') {
                throw new BadRequestError('Cannot cancel order that is already shipping');
            }

            // huỷ => khôi phục stock
            if (status === 'CANCELLED' && currentStatus !== 'CANCELLED') {
                for (const item of order.items) {
                    // khoio phuc variant
                    await tx.productVariant.update({
                        where: { id: item.variantId },
                        data: {
                            stock: {
                                increment: item.quantity
                            }
                        }
                    });

                    // khoi phjuc product stock
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                increment: item.quantity
                            }
                        }
                    });
                }
            }

            const updateData = { status };

            // cap nhat trang thai thanh toan khi status = delivered (cho COD)
            if (status === 'DELIVERED' && order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING') {
                updateData.paymentStatus = 'PAID';
                updateData.paidAt = new Date();
            }

            // admin notes (nối ghi chú)
            if (adminNotes !== undefined) {
                if (adminNotes) {
                    // nối vào note hiện có
                    const timestamp = new Date().toISOString();
                    const noteWithTimestamp = `[${timestamp}] ${adminNotes}`;

                    updateData.adminNotes = order.adminNotes
                        ? `${order.adminNotes}\n\n${noteWithTimestamp}`
                        : noteWithTimestamp;
                } else {
                    // nếu admin ko note thì giữ cái cũ
                    // ngăn trường hợp admin gửi chuỗi rỗng sẽ xoá ghi chú
                    updateData.adminNotes = order.adminNotes;
                }
            }

            updatedOrder = await tx.order.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    orderNumber: true,
                    userId: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true
                        }
                    },
                    status: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    paidAt: true,
                    shippingName: true,
                    shippingPhone: true,
                    shippingAddress: true,
                    shippingWard: true,
                    shippingDistrict: true,
                    shippingCity: true,
                    subtotal: true,
                    shippingFee: true,
                    tax: true,
                    discount: true,
                    total: true,
                    notes: true,
                    adminNotes: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
        });

        const formattedOrder = {
            id: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
            customer: {
                id: updatedOrder.user.id,
                email: updatedOrder.user.email,
                name: `${updatedOrder.user.firstName || ''} ${updatedOrder.user.lastName || ''}`.trim() || 'N/A'
            },
            status: updatedOrder.status,
            paymentMethod: updatedOrder.paymentMethod,
            paymentStatus: updatedOrder.paymentStatus,
            paidAt: updatedOrder.paidAt,
            shippingAddress: {
                fullName: updatedOrder.shippingName,
                phone: updatedOrder.shippingPhone,
                address: updatedOrder.shippingAddress,
                ward: updatedOrder.shippingWard,
                district: updatedOrder.shippingDistrict,
                city: updatedOrder.shippingCity
            },
            subtotal: updatedOrder.subtotal,
            shippingFee: updatedOrder.shippingFee,
            tax: updatedOrder.tax,
            discount: updatedOrder.discount,
            total: updatedOrder.total,
            notes: updatedOrder.notes,
            adminNotes: updatedOrder.adminNotes,
            createdAt: updatedOrder.createdAt,
            updatedAt: updatedOrder.updatedAt
        };

        return new OK({
            message: 'Order status updated successfully',
            metadata: formattedOrder
        }).send(res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    cancelOrder,
    getAllOrdersAdmin,
    updateOrderStatus,
    getOrderByIdAdmin
}