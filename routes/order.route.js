const router = require('express').Router();
const { createOrder } = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');

router.post('/', authenticate, createOrder)

module.exports = router;