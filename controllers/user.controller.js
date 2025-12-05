const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const createError = require('http-errors');
const { deleteImage } = require('../utils/cloudinary.helper');
const { updateProfileSchema, getAllUsersSchema, updateUserByAdminSchema } = require('../middlewares/validations/user.validation');
const { filterSensitiveUserFields } = require('../utils/filterSensitiveUserFields');
const { NotFoundError, BadRequestError } = require('../utils/core/errorResponse');
const { OK } = require('../utils/core/successResponse');
const { USER_PUBLIC_SELECT, USER_WITH_DELETED_SELECT, USER_GET_ADMIN_SELECT } = require('../prisma/constants/user-selects');

// get current user profile
const getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                addresses: true
            }
        });
        if (!user) throw new NotFoundError('User not found');

        // Xóa cột userId khỏi mỗi address
        if (user?.addresses) {
            user.addresses = user.addresses.map(({ userId, ...address }) => address);
        }

        return new OK({
            message: 'Get user successfully',
            data: {
                user: filterSensitiveUserFields(user),
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
}

const updateProfile = async (req, res, next) => {
    try {
        const id = req.user.id;

        const { error, value } = updateProfileSchema.validate({ ...req.body, id }, { abortEarly: false }) // abortEarly: false tức là trả về tất cả lỗi, không dừng ở lỗi đầu tiên
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const user = await prisma.user.findUnique({
            where: { id, isDeleted: false },
            select: USER_PUBLIC_SELECT
        });
        if (!user) throw new NotFoundError('User not found');

        await prisma.user.update({
            where: { id },
            data: value
        });

        return new OK({
            message: 'Profile updated successfully'
        }).send(res);
    } catch (error) {
        next(error);
    }
}

const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const { id } = req.query;
        const { error } = changePasswordSchema.validate({ ...req.body, id }, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundError('User not found');

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) throw new AuthFailureError('Old password is incorrect');

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: await hashedPassword(newPassword),
                password_changed_at: new Date(),
            }
        })

        return new OK({
            message: 'Password changed successfully',
        }).send(res);
    } catch (error) {
        next(error);
    }
}

const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) return next(createError(400, 'Please upload an image file'));
        const avatarUrl = req.file.path;

        // update vao db
        await prisma.user.update({
            where: { id: req.user.id },
            data: { avatarUrl }
        });

        // neu co avatar cu thi xoa
        if (req.user.avatarUrl && req.user.avatarUrl.includes('cloudinary')) {
            await deleteImage(req.user.avatarUrl, 'shop.co/avatars');
        }

        return new OK({
            message: 'Avatar uploaded successfully'
        }).send(res);
    } catch (error) {
        // neu co loi va da upload len cloudinary thi phai xoa
        if (req.file && req.file.filename) {
            await deleteImage(req.file.path, 'shop.co/avatars');
        }
        next(error);
    }
}

// delete avatar (set về default)
const deleteAvatar = async (req, res, next) => {
    try {
        if (!req.user.avatarUrl || req.user.avatarUrl.includes('default.png')) return next(createError(400, 'No avatar to delete'));

        const oldAvatarUrl = req.user.avatar;

        if (oldAvatarUrl.includes('cloudinary')) {
            await deleteImage(oldAvatarUrl, 'shop.co/avatars');
        }

        // cap nhat database
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                avatarUrl: `${process.env.FE_URL}/default.png`
            }
        });

        return new OK({ message: 'Avatar deleted successfully' }).send(res);
    } catch (error) {
        next(error);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const { error, value } = getAllUsersSchema.validate(req.query, {
            abortEarly: false, // lấy tất cả các lỗi
            stripUnknown: true // bỏ các trường ko đc định nghĩa trong joi schema
        });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }

        const {
            page, limit, sortBy, sortOrder, search,
            role, isEmailVerified, isActive, createdFrom,
            createdTo, phone, isDeleted, deletedBy, deletedFrom, deletedTo,
            updatedFrom, updatedTo
        } = value;

        const skip = (page - 1) * limit;

        // search filter
        const where = {};
        if (search && search.trim()) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ]
        }

        // role filter
        if (role) where.role = role;

        // isActive filter
        if (isActive !== undefined) where.isActive = isActive;

        // email verification filter
        if (isEmailVerified !== undefined) where.isEmailVerified = isEmailVerified;

        // isDeleted
        if (isDeleted !== undefined) where.isDeleted = isDeleted;

        // isDelectedBy
        if (deletedBy !== undefined) where.deletedBy = deletedBy;

        // phone filter
        if (phone) where.phone = phone;

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

        // orderby
        const orderBy = { [sortBy]: sortOrder };

        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                select: USER_PUBLIC_SELECT
            }),
            prisma.user.count({ where })
        ])

        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return new OK({
            message: 'Get all users successfully',
            data: {
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasPrevPage,
                    hasNextPage,
                },
                users
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
}

const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: USER_GET_ADMIN_SELECT
        });
        if (!user) throw new NotFoundError('Invalid Id or User not found');

        return new OK({
            message: "Get user successfully",
            data: {
                user
            }
        }).send(res);
    } catch (error) {
        next(error);
    }
}

const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const actor = req.user;

        // if (id === actor.id) {
        //     throw new BadRequestError('Cannot update your own account via admin endpoint. Use profile update instead.');
        // }

        const { error, value } = updateUserByAdminSchema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            throw new BadRequestError(errorMessages);
        }
        if (Object.keys(value).length === 0) throw new BadRequestError('No fields to update');

        let updatedUser;
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id },
                select: USER_PUBLIC_SELECT
            });
            if (!user) throw new NotFoundError('Invalid Id or User not found or has been deleted');

            // Prevent changing role to ADMIN if there's only one admin left
            if (value.role && user.role === 'ADMIN' && value.role !== 'ADMIN') {
                const adminCount = await tx.user.count({
                    where: {
                        role: 'ADMIN',
                        isActive: true,
                        isDeleted: false,
                        id: { not: id }
                    }
                });
                if (adminCount === 0) throw new ForbiddenError('Cannot change role of the last active admin');
            }

            // Prevent deactivating last admin
            if (value.isActive && user.isActive === 'ADMIN' && value.isActive !== true) {
                const adminCount = await tx.user.count({
                    where: {
                        role: 'ADMIN',
                        isActive: true,
                        isDeleted: false,
                        id: { not: id }
                    }
                });
                if (adminCount === 0) throw new ForbiddenError('Cannot deactivate the last active admin');
            }

            if (value.isDeleted !== user.isDeleted) {
                value.deletedBy = actor.id;
                value.deletedAt = new Date();
            }

            updatedUser = await tx.user.update({
                where: { id },
                data: value,
                select: USER_WITH_DELETED_SELECT
            })
        })

        // Track what changed for logging
        // const changes = {};
        // Object.keys(value).forEach(key => {
        //     if (userToUpdate[key] !== value[key]) {
        //         changes[key] = {
        //             from: userToUpdate[key],
        //             to: value[key]
        //         };
        //     }
        // });

        // You can also save to database audit log:
        // await tx.auditLog.create({
        //     data: {
        //         action: 'USER_UPDATE',
        //         performedBy: adminId,
        //         targetUserId: id,
        //         changes: JSON.stringify(changes),
        //         timestamp: new Date()
        //     }
        // });

        return new OK({
            message: 'User updated successfully',
            data: updatedUser
        }).send(res);
    } catch (error) {
        next(error);
    }
}

const toggleSoftDeleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const actor = req.user.id;

        const user = await prisma.user.findUnique({ where: { id } })
        if (!user) throw new NotFoundError('Invalid Id or User not found');

        const data = {
            isDeleted: false,
            deletedAt: new Date(),
            deletedBy: actor.id
        };
        let message = "";

        if (user.isDeleted) {
            data.isDeleted = false;
            message = id !== actor.id ? "Recover the user successfully" : "Recover your account successfully";
        } else if (!user.isDeleted) {
            data.isDeleted = true;
            message = id !== actor.id ? "Delete the user successfully" : "You have successfully deleted your account";
        }

        await prisma.user.update({
            where: { id },
            data
        })

        return new OK({ message }).send(res);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAvatar,
    getAllUsers,
    getUserById,
    updateUser,
    toggleSoftDeleteUser,
}