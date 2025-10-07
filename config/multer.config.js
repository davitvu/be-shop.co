const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary.config');
const createError = require('http-errors');

// avatar config
const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'shop.co/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [
            { quality: 'auto' }
        ],
        public_id: (req, file) => {
            return `${req.user.id}-${Date.now()}`;
        }
    }
});

// product config
const productStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'shop.co/products',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ quality: 'auto' }],
        public_id: (req, file) => {
            return `product-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        }
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(createError(400, 'Only image files are allowed (jpeg, jpg, png)'), false);
    }
};

// avatar (single file)
const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    }
});

// product images (multiple files)
const uploadProductImages = multer({
    storage: productStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    }
});

module.exports = {
    uploadAvatar,
    uploadProductImages,
};