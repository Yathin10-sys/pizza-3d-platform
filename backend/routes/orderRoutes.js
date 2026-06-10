const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  getUserOrders,
  getOrderDetails,
  adminGetOrders,
  adminUpdateOrderStatus
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.post('/checkout', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.get('/my-orders', protect, getUserOrders);
router.get('/track/:id', protect, getOrderDetails);

// Admin Order Endpoints
router.get('/admin/all', protect, admin, adminGetOrders);
router.put('/admin/status/:id', protect, admin, adminUpdateOrderStatus);

module.exports = router;
