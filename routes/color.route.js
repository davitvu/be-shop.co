const router = require('express').Router();
const { getAllColorsAdmin, getAllColorsClient, createColor, updateColor, deleteColor, getColorById } = require('../controllers/color.controller');

router.get('/', getAllColorsClient);
router.get('/admin', getAllColorsAdmin);
router.get('/admin/:id', getColorById);
router.post('/admin', createColor);
router.put('/admin/:id', updateColor);
router.delete('/admin/:id', deleteColor);

module.exports = router;