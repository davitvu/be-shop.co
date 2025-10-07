const router = require('express').Router();
const { register, login, logout, refreshAccessToken } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshAccessToken);
// router.get('/verify-email/:token', verifyEmail);
// router.post('/forgot-password', forgotPassword);

module.exports = router;