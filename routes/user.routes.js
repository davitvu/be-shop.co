const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');
const { uploadAvatar } = require('../config/multer.config');

router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, userController.updateProfile);
router.post('/avatar', authenticate, uploadAvatar.single('avatar'), userController.uploadAvatar);
router.delete('/avatar', authenticate, userController.deleteAvatar);

module.exports = router;