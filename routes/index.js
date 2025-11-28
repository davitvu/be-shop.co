const router = require('express').Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const addressRoutes = require('./address.route');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const variantRoutes = require('./variant.route');
const colorRoutes = require('./color.route');
const sizeRoutes = require('./size.route');
const styleRoutes = require('./style.route');
const cartRoutes = require('./cart.route');
const orderRoutes = require('./order.route');
const reviewRoutes = require('./review.route');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/addresses', addressRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/variants', variantRoutes);
router.use('/colors', colorRoutes);
router.use('/sizes', sizeRoutes);
router.use('/styles', styleRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);

// health & check
router.get("/", (req, res) => {
    res.send("Server on - shop.co - version: 1.0");
})

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is running',
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;