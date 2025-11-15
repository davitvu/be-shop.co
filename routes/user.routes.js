const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');
const { uploadAvatar } = require('../config/multer.config');
const { authorize } = require('../middlewares/authorize.middleware');

router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, userController.updateProfile);

router.put('/change-password/:id', authenticate, userController.changePassword);

router.post('/avatar', authenticate, uploadAvatar.single('avatar'), userController.uploadAvatar);
router.delete('/avatar', authenticate, authorize('admin'), userController.deleteAvatar);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', authenticate, userController.updateUser);
router.put('/delete/:id', authenticate, userController.toggleSoftDeleteUser);

module.exports = router;