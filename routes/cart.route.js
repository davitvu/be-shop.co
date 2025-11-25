const { addToCart, getCart, updateCartItem, deleteCartItem, clearCart } = require('../controllers/cart.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');

const router = require('express').Router();

router.get('/', authenticate, getCart);
router.post('/', authenticate, addToCart);
router.put('/:itemId', authenticate, updateCartItem);
router.delete('/:itemId', authenticate, deleteCartItem);
router.delete('/', authenticate, clearCart);

module.exports = router;