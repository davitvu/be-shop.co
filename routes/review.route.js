const router = require('express').Router();
const { getReviewsByProduct, createReview, updateReview, deleteReview, getUserReviews, getFeaturedReviews } = require('../controllers/review.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');

// Public routes
router.get('/product/:productId', getReviewsByProduct);

// User routes
router.get('/my-reviews', authenticate, getUserReviews);
router.post('/', authenticate, createReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);
router.get('/featured-reviews', getFeaturedReviews);

module.exports = router;