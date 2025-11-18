/**
 * Public fields for User model
 * Use this in Prisma queries to exclude sensitive data
 */
const USER_PUBLIC_SELECT = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    phone: true,
    avatarUrl: true,
    role: true,
    isActive: true,
    isEmailVerified: true,
    password_changed_at: true,
    isDeleted: true,
    createdAt: true,
    updatedAt: true
};

const USER_WITH_DELETED_SELECT = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    phone: true,
    avatarUrl: true,
    role: true,
    isActive: true,
    isEmailVerified: true,
    password_changed_at: true,
    isDeleted: true,
    deletedBy: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true
};

const USER_GET_ADMIN_SELECT = {
    ...USER_WITH_DELETED_SELECT,
    deletedByUser: {
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
        },
    },
    deletedUsers: {
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
        },
    },
};

module.exports = {
    USER_PUBLIC_SELECT,
    USER_WITH_DELETED_SELECT,
    USER_GET_ADMIN_SELECT,
};