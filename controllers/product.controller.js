// src/controllers/product.controller.js

const createHttpError = require("http-errors");
const { deleteMultipleImages } = require("../utils/cloudinary.helper");

const uploadProductImagesController = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return next(createHttpError(400, 'Please upload at least one image'));
        }

        // Lấy URLs của tất cả ảnh
        const imageUrls = req.files.map(file => file.path);

        // Lưu vào database (ví dụ)
        // await Product.update({ images: imageUrls }, { where: { id: productId } });

        return res.json({
            success: true,
            message: `${imageUrls.length} images uploaded successfully`,
            data: {
                images: imageUrls,
            },
        });
    } catch (error) {
        // Xóa tất cả ảnh vừa upload nếu có lỗi
        if (req.files && req.files.length > 0) {
            const urls = req.files.map(file => file.path);
            await deleteMultipleImages(urls, 'shop.co/products');
        }
        next(error);
    }
};