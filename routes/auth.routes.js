const router = require('express').Router();
const { register, login, logout, refreshToken, forgotPassword, verifyOtpAndToken, resetPassword, sendVerificationEmail, verifyEmail, googleCallback, getGoogleLoginUrl, checkStepResetPassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');
const { getGoogleAuthURL } = require('../utils/googleAuth');

// ================== GOOGLE AUTH ROUTES ==================
router.get('/google/url', getGoogleLoginUrl);
router.get('/google/callback', googleCallback);

// ==================== PUBLIC ROUTES ====================
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp/token', verifyOtpAndToken);
router.get('/reset/check', checkStepResetPassword);
router.post('/reset', resetPassword);
router.post('/refresh-token', refreshToken);

// ==================== USER ROUTES =====================
router.post('/logout', authenticate, logout);
router.post('/send-verification-email', authenticate, sendVerificationEmail);
router.get('/verify-email', verifyEmail);


module.exports = router;