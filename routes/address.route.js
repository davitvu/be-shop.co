const router = require('express').Router();
const addressController = require('../controllers/address.controller');
const { authenticate } = require('../middlewares/authenticate.middleware');

router.get('/', authenticate, addressController.getAllAddresses);
router.get('/:id', authenticate, addressController.getAddressById);
router.post('/', authenticate, addressController.createAddress);
router.put('/:id', authenticate, addressController.updateAddress);
router.patch('/:id/default', authenticate, addressController.setDefaultAddress);
router.delete('/:id', authenticate, addressController.deleteAddress);

module.exports = router;