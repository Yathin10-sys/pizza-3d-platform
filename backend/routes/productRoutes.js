const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getIngredients,
  addProductReview
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/ingredients', getIngredients);
router.get('/:id', getProductById);
router.post('/:id/reviews', protect, addProductReview);

module.exports = router;
