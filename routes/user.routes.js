const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');
const { uploadAvatar } = require('../config/multer.config');
const { authorize } = require('../middlewares/authorize.middleware');

// === Client ===
router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, userController.updateProfile);

router.put('/change-password/:id', authenticate, userController.changePassword);

router.post('/avatar', authenticate, uploadAvatar.single('avatar'), userController.uploadAvatar);
router.delete('/avatar', authenticate, authorize('admin'), userController.deleteAvatar);

// === Admin ===
router.get('/admin', userController.getAllUsers);
router.get('/admin/:id', userController.getUserById);
router.put('/admin/:id', authenticate, userController.updateUser);
router.delete('/admin/delete/:id', authenticate, userController.toggleSoftDeleteUser);

module.exports = router;