const router = require('express').Router();
const { createOrder, getAllOrders, getOrderById, cancelOrder, getAllOrdersAdmin, updateOrderStatus, getOrderByIdAdmin } = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');

// ==================== ADMIN ROUTES ====================
router.get('/admin', authenticate, getAllOrdersAdmin);
router.get('/admin/:id', authenticate, getOrderByIdAdmin);
router.patch('/admin/:id/status', authenticate, updateOrderStatus);

// ==================== USER ROUTES ====================
router.get('/', authenticate, getAllOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/', authenticate, createOrder);
router.post('/:id/cancel', authenticate, cancelOrder);



module.exports = router;