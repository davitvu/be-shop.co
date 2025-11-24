const router = require('express').Router();
const { createVariant, getAllVariants, getVariantById, updateVariant, softDeleteVariant, restoreVariant } = require('../controllers/variant.controller');

router.post('/admin', createVariant);
router.get('/admin/product/:productId', getAllVariants);
router.get('/admin/:id', getVariantById);
router.put('/admin/:id', updateVariant);
router.delete('/admin/:id', softDeleteVariant);
router.post('/admin/:id', restoreVariant);

module.exports = router;