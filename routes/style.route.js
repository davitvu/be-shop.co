const { getAllStylesClient, getAllStylesAdmin, getStyleById, getStyleBySlug, createStyle, updateStyle, deleteStyle } = require('../controllers/style.controller');

const router = require('express').Router();

router.get('/', getAllStylesClient);
router.get('/:slug', getStyleBySlug);
router.get('/admin', getAllStylesAdmin);
router.get('/admin/:id', getStyleById);
router.post('/admin', createStyle);
router.put('/admin/:id', updateStyle);
router.delete('/admin/:id', deleteStyle);

module.exports = router;