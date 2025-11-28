const { PrismaClient } = require('@prisma/client');
const { addToCartSchema, updateCartItemSchema } = require('../middlewares/validations/cart.validation');
const { NotFoundError, BadRequestError } = require('../utils/core/errorResponse');
const { OK } = require('../utils/core/successResponse');
const { CARTITEM_PUBLIC_SELECT } = require('../prisma/constants/cartItem-selects');
const prisma = new PrismaClient();

const addToCart = async (req, res, next) => {
    try {
        const { error, value } = addToCartSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { variantId, quantity } = value;
        const userId = req.user.id;

        let cartItem;

        await prisma.$transaction(async (tx) => {
            // check ton tai variant
            const variant = await tx.productVariant.findFirst({
                where: { id: variantId, isDeleted: false },
                select: {
                    id: true,
                    stock: true,
                    isPublished: true,
                    price: true,
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            isPublished: true,
                            isDeleted: false,
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
                        where: { isMain: true },
                        select: {
                            id: true,
                            url: true,
                            alt: true
                        },
                        take: 1
                    }
                }
            });

            if (!variant) throw new NotFoundError('Variant not found or has been deleted');
            if (!variant.isPublished) throw new BadRequestError('This variant is not available');
            if (!variant.product.isPublished || variant.product.isDeleted) {
                throw new BadRequestError('This product is not available');
            }

            if (variant.stock < quantity) {
                throw new BadRequestError(`Only ${variant.stock} item(s) available in stock`);
            }

            // tao cart cho user
            let cart = await tx.cart.findFirst({
                where: { userId },
                select: { id: true }
            });
            if (!cart) {
                cart = await tx.cart.create({
                    data: { userId },
                    select: { id: true }
                });
            }

            // kiem tra item ton tai trong cart
            const existingItem = await tx.cartItem.findUnique({
                where: {
                    cartId_variantId: {
                        cartId: cart.id,
                        variantId
                    }
                },
                select: { id: true, quantity: true }
            });
            if (existingItem) {
                // nếu tồn tại thì update số lượng
                const newQuantity = existingItem.quantity + quantity;

                if (variant.stock < newQuantity) {
                    throw new BadRequestError(`Only ${variant.stock} item(s) available in stock`);
                }

                cartItem = await tx.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: { increment: quantity } },
                    select: CARTITEM_PUBLIC_SELECT
                });
            } else {
                // không thì tạo mới
                cartItem = await tx.cartItem.create({
                    data: {
                        cartId: cart.id,
                        variantId,
                        quantity
                    },
                    select: CARTITEM_PUBLIC_SELECT
                });
            }

        });

        const formattedItem = {
            id: cartItem.id,
            variant: {
                id: cartItem.variant.id,
                sku: cartItem.variant.sku,
                price: cartItem.variant.price,
                stock: cartItem.variant.stock,
                product: cartItem.variant.product,
                color: cartItem.variant.color,
                size: cartItem.variant.size,
                image: cartItem.variant.images[0] || null
            },
            quantity: cartItem.quantity,
            subtotal: cartItem.variant.price * cartItem.quantity,
            createdAt: cartItem.createdAt,
            updatedAt: cartItem.updatedAt
        };

        return new OK({
            message: 'Item added to cart successfully',
            metadata: formattedItem
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const getCart = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const cart = await prisma.cart.findFirst({
            where: { userId },
            select: {
                id: true,
                items: {
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        quantity: true,
                        variant: {
                            select: {
                                id: true,
                                sku: true,
                                price: true,
                                stock: true,
                                isPublished: true,
                                isDeleted: true,
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true,
                                        isPublished: true,
                                        isDeleted: true
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
                                    where: { isMain: true },
                                    select: {
                                        id: true,
                                        url: true,
                                        alt: true
                                    },
                                    take: 1
                                }
                            }
                        },
                        createdAt: true,
                        updatedAt: true
                    }
                },
                createdAt: true,
                updatedAt: true
            }
        });

        if (!cart) {
            return new OK({
                message: "Cart is empty",
                metadata: {
                    items: [],
                    summary: {
                        totalItems: 0,
                        totalQuantity: 0,
                        subtotal: 0,
                        total: 0
                    }
                }
            }).send(res);
        }

        let totalItems = 0;
        let totalQuantity = 0;
        let subtotal = 0;

        const formattedItems = cart.items.map(item => {
            const price = item.variant.price;
            const itemSubtotal = price * item.quantity;

            const isAvailable =
                !item.variant.isDeleted &&
                item.variant.isPublished &&
                !item.variant.product.isDeleted &&
                item.variant.product.isPublished;

            const hasStock = item.variant.stock >= item.quantity;

            // chỉ tính các mục khả dụng
            if (isAvailable && hasStock) {
                totalItems++;
                totalQuantity += item.quantity;
                subtotal += itemSubtotal;
            }

            return {
                id: item.id,
                variant: {
                    id: item.variant.id,
                    sku: item.variant.sku,
                    price: price,
                    stock: item.variant.stock,
                    product: {
                        id: item.variant.product.id,
                        name: item.variant.product.name,
                        slug: item.variant.product.slug,
                    },
                    color: item.variant.color,
                    size: item.variant.size,
                    image: item.variant.images[0] || null
                },
                quantity: item.quantity,
                subtotal: itemSubtotal,
                isAvailable,
                hasStock,
                stockMessage: !hasStock ? `Only ${item.variant.stock} available` : null,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            };
        });

        return new OK({
            message: 'Get cart successfully',
            metadata: {
                items: formattedItems,
                summary: {
                    totalItems,
                    totalQuantity,
                    subtotal: subtotal,
                    total: subtotal
                }
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const updateCartItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.id;

        const { error, value } = updateCartItemSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const { quantity } = value;

        let updatedItem;

        await prisma.$transaction(async (tx) => {
            const cartItem = await tx.cartItem.findUnique({
                where: { id: itemId },
                select: {
                    id: true,
                    quantity: true,
                    variantId: true,
                    cart: {
                        select: {
                            userId: true
                        }
                    }
                }
            });
            if (!cartItem) throw new NotFoundError('Cart item not found');

            if (cartItem.cart.userId !== userId) {
                throw new BadRequestError('This cart item does not belong to you');
            }

            const variant = await tx.productVariant.findFirst({
                where: { id: cartItem.variantId, isDeleted: false },
                select: {
                    id: true,
                    stock: true,
                    isPublished: true,
                    price: true,
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            isPublished: true,
                            isDeleted: false
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
                        where: { isMain: true },
                        select: {
                            id: true,
                            url: true,
                            alt: true
                        },
                        take: 1
                    }
                }
            });

            if (!variant) throw new NotFoundError('Variant not found or has been deleted');
            if (!variant.isPublished) throw new BadRequestError('This variant is not available');
            if (!variant.product.isPublished || variant.product.isDeleted) throw new BadRequestError('This product is not available');
            if (variant.stock < quantity) throw new BadRequestError(`Only ${variant.stock} item(s) available in stock`);

            updatedItem = await tx.cartItem.update({
                where: { id: itemId },
                data: { quantity },
                select: {
                    id: true,
                    quantity: true,
                    variant: {
                        select: {
                            id: true,
                            sku: true,
                            price: true,
                            stock: true,
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
                                where: { isMain: true },
                                select: {
                                    id: true,
                                    url: true,
                                    alt: true
                                },
                                take: 1
                            }
                        }
                    },
                    createdAt: true,
                    updatedAt: true
                }
            });
        });

        const formattedItem = {
            id: updatedItem.id,
            variant: {
                id: updatedItem.variant.id,
                sku: updatedItem.variant.sku,
                price: updatedItem.variant.price,
                stock: updatedItem.variant.stock,
                product: updatedItem.variant.product,
                color: updatedItem.variant.color,
                size: updatedItem.variant.size,
                image: updatedItem.variant.images[0] || null
            },
            quantity: updatedItem.quantity,
            subtotal: updatedItem.variant.price * updatedItem.quantity,
            createdAt: updatedItem.createdAt,
            updatedAt: updatedItem.updatedAt
        };

        return new OK({
            message: 'Cart item updated successfully',
            metadata: formattedItem
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const deleteCartItem = async (req, res, next) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.id;

        await prisma.$transaction(async (tx) => {
            const cartItem = await tx.cartItem.findUnique({
                where: { id: itemId },
                select: {
                    id: true,
                    cart: {
                        select: {
                            userId: true
                        }
                    }
                }
            });
            if (!cartItem) throw new NotFoundError('Cart item not found');
            if (cartItem.cart.userId !== userId) {
                throw new BadRequestError('This cart item does not belong to you');
            }

            await tx.cartItem.delete({
                where: { id: itemId }
            });
        });

        return new OK({
            message: 'Item removed from cart successfully'
        }).send(res);
    } catch (error) {
        next(error);
    }
};

const clearCart = async (req, res, next) => {
    try {
        const userId = req.user.id;

        await prisma.$transaction(async (tx) => {
            const cart = await tx.cart.findFirst({
                where: { userId },
                select: {
                    id: true,
                    _count: {
                        select: { items: true }
                    }
                }
            });
            if (!cart) throw new NotFoundError('Cart not found');
            if (cart._count.items === 0) throw new BadRequestError('Cart is already empty');

            await tx.cartItem.deleteMany({
                where: { cartId: cart.id }
            });
        });

        return new OK({
            message: 'Cart cleared successfully'
        }).send(res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addToCart,
    getCart,
    updateCartItem,
    deleteCartItem,
    clearCart
}