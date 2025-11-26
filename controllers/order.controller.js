const { PrismaClient } = require('@prisma/client');
const { createOrderSchema } = require('../middlewares/validations/order.validation');
const { generateOrderNumber } = require('../utils/generateOrderNumber');
const { BadRequestError, NotFoundError } = require('../utils/core/errorResponse');
const { Created } = require('../utils/core/successResponse');
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

module.exports = {
    createOrder,
}