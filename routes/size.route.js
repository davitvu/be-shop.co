const { getAllSizesAdmin, getAllSizesClient, getSizeById, createSize, updateSize, deleteSize } = require('../controllers/size.controller');
const router = require('express').Router();

router.get('/', getAllSizesClient);
router.get('/admin', getAllSizesAdmin);
router.get('/admin/:id', getSizeById);
router.post('/admin', createSize);
router.put('/admin/:id', updateSize);
router.delete('/admin/:id', deleteSize);

module.exports = router;