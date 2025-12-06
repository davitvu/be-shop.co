const router = require('express').Router();
const { uploadProductImages } = require('../config/multer.config');
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');
const { authorize } = require('../middlewares/authorize.middleware');

// ==================== CLIENT ROUTES ===================
router.get('/', productController.getAllProductsClient);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/top-selling', productController.getTopSelling);
router.get('/related-products/:productId', productController.getRelatedProducts);
// router.get('/top-rated', getTopRatedProducts);
router.get('/:slug', productController.getProductBySlugClient);

// ==================== ADMIN ROUTES ====================
router.get('/admin/:id', productController.getProductByIdAdmin);
router.get('/admin', productController.getAllProductsAdmin);
router.post('/admin', productController.createProduct);
router.post('/admin/:id/restore', productController.restoreProduct);
router.put('/admin/:id', productController.updateProduct);
router.delete('/admin/:id', productController.softDeleteProduct);
router.delete('/admin/:id/permanent', productController.permanentDeleteProduct);

// ==================== IMAGES ROUTES ===================
router.get('/admin/:productId/images', productController.getProductImages);
router.post('/admin/:productId/images', uploadProductImages.array('images', 10), productController.uploadProductImages);
router.put('/admin/images/:imageId', productController.updateProductImage);
router.delete('/admin/images/:imageId', productController.deleteProductImage);
router.delete('/admin/:productId/images/bulk', productController.bulkDeleteProductImages);
router.put('/admin/:productId/images/reorder', productController.reorderProductImages);


module.exports = router;