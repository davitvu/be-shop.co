const router = require('express').Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

/** Client */
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
/** Manager */


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