const router = require("express").Router();
const { createCategory, getAllCategoriesClient, getCategoryById, getCategoryBySlug, getAllCategoriesAdmin, updateCategory, softDeleteCategory } = require("../controllers/category.controller");
const { authenticate } = require("../middlewares/authenticate.middleware");
const { authorize } = require("../middlewares/authorize.middleware");

// === Admin ===
router.get('/admin/:id', getCategoryById);
router.get('/admin', getAllCategoriesAdmin);

router.post('/admin', createCategory);
router.put('/admin/:id', updateCategory);
router.delete('/admin/:id', softDeleteCategory);

// === Client ===
router.get('/', getAllCategoriesClient);
router.get('/:slug', getCategoryBySlug);


module.exports = router;