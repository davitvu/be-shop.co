const router = require('express').Router();
const { register, login, logout, refreshToken, forgotPassword, verifyOtpForgotPassword, changePasswordWithOtp, sendVerificationEmail, verifyEmail } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');

/** Client */
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/refresh-token', authenticate, refreshToken);
router.post('/send-verification-email', authenticate, sendVerificationEmail);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/verify-token', verifyOtpForgotPassword);
router.post('/change-password-otp', changePasswordWithOtp);

module.exports = router;