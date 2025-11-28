const { createCoupon, getAllCoupons, getCouponByIdAdmin, updateCoupon, deleteCoupon, validateCoupon, getAvailableCoupons } = require('../controllers/coupon.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');
const { authorize } = require('../middlewares/authorize.middleware');

const router = require('express').Router();

// ==================== PUBLIC ROUTES ====================
router.get('/available', getAvailableCoupons);

// ==================== USER ROUTES =====================
router.post('/validate', authenticate, validateCoupon);

// ==================== ADMIN ROUTES ====================
router.get('/', authenticate, authorize('admin', 'manager'), getAllCoupons);
router.get('/:id', authenticate, authorize('admin', 'manager'), getCouponByIdAdmin);
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), createCoupon);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateCoupon);
router.delete('/:id', authenticate, authorize('ADMIN', 'MANAGER'), deleteCoupon);


module.exports = router;