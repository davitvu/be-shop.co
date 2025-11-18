const CATEGORY_PUBLIC_SELECT = {
    id: true,
    name: true,
    slug: true,
    description: true,
    isPublished: true,
    createdAt: true,
    updatedAt: true,
    _count: {
        select: { products: true }
    }
};

const CATEGORY_WITH_PRODUCTS_SELECT = {
    ...CATEGORY_PUBLIC_SELECT,
    products: {
        where: { isDeleted: false, isPublished: true },
        select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            stock: true,
            isPublished: true,
            createdAt: true,
            updatedAt: true,
        }
    }
};

CATEGORY_WITH_DELETED_SELECT = {
    ...CATEGORY_PUBLIC_SELECT,
    isDeleted: true,
    deletedAt: true
}

CATEGORY_WITH_PRODUCTS_DELETED_SELECT = {
    ...CATEGORY_WITH_PRODUCTS_SELECT,
    isDeleted: true,
    deletedAt: true
}

module.exports = {
    CATEGORY_PUBLIC_SELECT,
    CATEGORY_WITH_PRODUCTS_SELECT,
    CATEGORY_WITH_PRODUCTS_DELETED_SELECT,
    CATEGORY_WITH_DELETED_SELECT
};