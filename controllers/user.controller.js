const cloudinary = require('../config/cloudinary.config');
const { updateProfileSchema } = require('../middlewares/validator/user.validator');
const { User } = require('../models');
const createError = require('http-errors');
const { deleteImage } = require('../utils/cloudinary.helper');

// get current user profile
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [
                {
                    association: 'addresses',
                    attributes: { exclude: ['userId'] },
                },
            ],
        });

        if (!user) return next(createError(400, 'User not found'));

        return res.status(200).json({
            success: true,
            user: user,
        });
    } catch (error) {
        next(error);
    }
}

const updateProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const userId = req.user.id;
        const email = req.user.email;

        const { error } = updateProfileSchema.validate({ ...req.body, userId, email }, { abortEarly: false }) // abortEarly: false tức là trả về tất cả lỗi, không dừng ở lỗi đầu tiên
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            return next(createError(400, errorMessages))
        }

        if (email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser && existingUser.id !== userId) {
                return next(createError(409, 'Email already exists'));
            }
        }

        await req.user.update({
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phone && { phone }),
        });

        return res.json({
            success: true,
            message: 'Profile updated successfully',
            data: req.user,
        });
    } catch (error) {
        next(error);
    }
}

const uploadAvatar = async (req, res, next) => {
    console.log(req.file);
    try {

        if (!req.file) return next(createError(400, 'Please upload an image file'));

        const avatarUrl = req.file.path;

        // neu co avatar cu thi xoa
        if (req.user.avatar?.includes('cloudinary') || !avatarUrl.includes('default.png')) {
            await deleteImage(req.user.avatar, 'shop.co/avatars');
        }

        // update vao db
        await req.user.update({ avatar: avatarUrl });

        return res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                avatar: avatarUrl,
            },
        });
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
        if (!req.user.avatar) return next(createError(400, 'No avatar to delete'));

        await deleteImage(req.file.path, 'shop.co/avatars');

        // cap nhat database
        await req.user.update({ avatar: null });

        return res.json({
            success: true,
            message: 'Avatar deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    getProfile,
    updateProfile,
    uploadAvatar,
    deleteAvatar
}