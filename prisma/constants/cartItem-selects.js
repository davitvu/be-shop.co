const CARTITEM_PUBLIC_SELECT = {
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

module.exports = {
    CARTITEM_PUBLIC_SELECT
}