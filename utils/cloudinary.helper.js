const cloudinary = require('../config/cloudinary.config');

// xoa 1 anh
const deleteImage = async (imageUrl, folder) => {
    try {
        if (!imageUrl || !imageUrl.includes('cloudinary')) {
            return { success: false, message: 'Not a Cloudinary URL' };
        }

        const urlParts = imageUrl.split('/');
        const publicId = urlParts[urlParts.length - 1].split('.')[0];
        const fullPublicId = `${folder}/${publicId}`;

        const result = await cloudinary.uploader.destroy(fullPublicId);
        return result;
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        throw error;
    }
}

// xoa nhieu anh
const deleteMultipleImages = async (imageUrls, folder) => {
    try {
        const publicIds = imageUrls
            .filter(url => url && url.includes('cloudinary'))
            .map(url => {
                const urlParts = imageUrl.split('/');
                const publicId = urlParts[urlParts.length - 1].split('.')[0];
                return `${folder}/${publicId}`;
            })

        if (publicIds.length === 0) {
            return { success: false, message: 'No valid Cloudinary URLs' };
        }

        const result = await cloudinary.api.delete_resources(publicIds);
        return result;
    } catch (error) {
        console.error('Error deleting multiple images:', error);
        throw error;
    }
}

const getImageInfo = async (publicId) => {
    try {
        const result = await cloudinary.api.resource(publicId);
        return result;
    } catch (error) {
        console.error('Error getting image info:', error);
        throw error;
    }
};

module.exports = {
    deleteImage,
    deleteMultipleImages,
    getImageInfo,
};