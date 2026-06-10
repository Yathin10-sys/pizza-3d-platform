const Order = require('../models/Order');
const User = require('../models/User');
const Ingredient = require('../models/Ingredient');

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Core counters
    const totalOrders = await Order.countDocuments({ paymentStatus: 'paid' });
    const pendingOrders = await Order.countDocuments({ paymentStatus: 'paid', orderStatus: { $ne: 'delivered' } });
    const deliveredOrders = await Order.countDocuments({ paymentStatus: 'paid', orderStatus: 'delivered' });
    const activeUsers = await User.countDocuments({ role: 'user' });

    // 2. Total Revenue
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // 3. Revenue Trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const revenueTrends = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: 'paid',
          createdAt: { $gte: sevenDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$grandTotal' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill missing days with 0
    const trendsMap = new Map(revenueTrends.map(t => [t._id, { revenue: t.revenue, count: t.count }]));
    const formattedTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const val = trendsMap.get(dateStr) || { revenue: 0, count: 0 };
      formattedTrends.push({
        date: dateStr,
        revenue: val.revenue,
        orders: val.count
      });
    }

    // 4. Most Ordered Pizza (top 5)
    const topPizzas = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.price' }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 }
    ]);

    // 5. Inventory Status (Low stock items)
    const lowStockCount = await Ingredient.countDocuments({ stock: { $lt: 20 } });
    const totalIngredients = await Ingredient.countDocuments();

    res.status(200).json({
      summary: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        activeUsers,
        lowStockCount,
        totalIngredients
      },
      revenueTrends: formattedTrends,
      topPizzas: topPizzas.map(p => ({
        name: p._id,
        quantity: p.quantity,
        revenue: p.revenue
      }))
    });
  } catch (error) {
    console.error('Analytics stats error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.exportSalesReport = async (req, res) => {
  try {
    const { format } = req.query; // 'csv' or 'excel' (we will output CSV for both)
    
    const orders = await Order.find({ paymentStatus: 'paid' })
      .populate('user', 'name email')
      .sort('-createdAt');

    // Build CSV content
    let csv = 'Order ID,Customer Name,Customer Email,Grand Total,Order Status,Payment Status,Items,Date\n';
    
    orders.forEach(order => {
      const itemsList = order.items.map(i => `${i.name} (${i.size} x${i.quantity})`).join('; ');
      const dateStr = order.createdAt.toISOString().replace(/T/, ' ').replace(/\..+/, '');
      
      // Clean comma/quotes
      const customerName = order.user ? `"${order.user.name.replace(/"/g, '""')}"` : 'Guest';
      const customerEmail = order.user ? order.user.email : 'N/A';
      
      csv += `${order.orderId},${customerName},${customerEmail},₹${order.grandTotal},${order.orderStatus},${order.paymentStatus},"${itemsList.replace(/"/g, '""')}",${dateStr}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales_report_${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
