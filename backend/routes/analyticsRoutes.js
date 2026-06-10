const express = require('express');
const router = express.Router();
const { getDashboardStats, exportSalesReport } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');

router.get('/dashboard', protect, admin, getDashboardStats);
router.get('/export', protect, admin, exportSalesReport);

module.exports = router;
