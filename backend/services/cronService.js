const cron = require('node-cron');
const Ingredient = require('../models/Ingredient');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendStockAlertEmail } = require('./mailService');
const { sendToAdmins } = require('./socketService');

const runStockCheck = async () => {
  console.log('Running stock monitoring check...');
  try {
    const lowStockItems = await Ingredient.find({ stock: { $lt: 20 } });
    
    if (lowStockItems.length === 0) {
      console.log('Inventory check complete: All items have sufficient stock.');
      return;
    }

    console.warn(`Found ${lowStockItems.length} low-stock items! Generating alerts.`);

    // 1. Create admin notification in database
    const notificationMessage = `The following ingredients are running low: ${lowStockItems.map(i => `${i.name} (${i.stock} left)`).join(', ')}. Please restock.`;
    
    const dbNotif = await Notification.create({
      user: null, // Admin alert
      title: '⚠️ Low Stock Warning',
      message: notificationMessage,
      type: 'stock'
    });

    // 2. Emit socket alert to active admin pages
    sendToAdmins('newNotification', dbNotif);
    sendToAdmins('lowStockAlert', lowStockItems);

    // 3. Email Alert to admins
    const admins = await User.find({ role: 'admin' });
    if (admins.length > 0) {
      const adminEmails = admins.map(a => a.email);
      for (const email of adminEmails) {
        await sendStockAlertEmail(email, lowStockItems);
      }
    } else {
      // If no admin registered yet, send to default testing admin address
      await sendStockAlertEmail('admin@sliceandspark.com', lowStockItems);
    }
  } catch (error) {
    console.error('Error during stock check cron:', error);
  }
};

const initCronJobs = () => {
  // Run every hour: '0 * * * *'
  // For development testing/verification we can also support a frequent run check,
  // but hourly is the requirement:
  cron.schedule('0 * * * *', runStockCheck);
  console.log('Hourly stock check cron job scheduled.');
};

module.exports = {
  initCronJobs,
  runStockCheck // Exported so we can trigger it manually for testing/routes
};
