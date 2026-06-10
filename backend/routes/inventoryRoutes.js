const express = require('express');
const router = express.Router();
const {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  triggerManualStockCheck
} = require('../controllers/inventoryController');
const { protect, admin } = require('../middleware/auth');

router.use(protect, admin); // Secure all endpoints for admins only

router.get('/', getInventory);
router.post('/', addInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);
router.post('/check-thresholds', triggerManualStockCheck);

module.exports = router;
