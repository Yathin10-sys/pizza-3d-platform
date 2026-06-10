const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Ingredient = require('../models/Ingredient');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const { createOrderSchema } = require('../validators/schemas');
const { sendOrderConfirmationEmail } = require('../services/mailService');
const { sendToAdmins, updateOrderTracking } = require('../services/socketService');

// Initialize Razorpay
// Will catch error if keys are dummy/not provided and fall back to simulation mode
let razorpayInstance = null;
try {
  if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('dummy')) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('Razorpay SDK initialized successfully.');
  } else {
    console.warn('Razorpay configured with dummy keys. Running in simulator mode.');
  }
} catch (error) {
  console.error('Razorpay initialization failed, using simulator mode:', error.message);
}

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { error } = createOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { items, deliveryAddress, couponCode } = req.body;

    // 1. Calculate backend total to prevent frontend price tampering
    let calculatedSubtotal = 0;

    // Fetch all ingredients to cross-verify price
    const dbIngredients = await Ingredient.find();
    const ingMap = new Map(dbIngredients.map(i => [i.name, i.price]));

    for (const item of items) {
      let itemPrice = 150; // Base pizza price default
      
      // Add crust cost
      itemPrice += ingMap.get(item.base) || 0;
      // Add sauce cost
      itemPrice += ingMap.get(item.sauce) || 0;
      // Add cheese cost
      itemPrice += ingMap.get(item.cheese) || 0;
      // Add veggie costs
      item.veggies.forEach(v => {
        itemPrice += ingMap.get(v) || 0;
      });
      // Add meat costs
      item.meats.forEach(m => {
        itemPrice += ingMap.get(m) || 0;
      });

      // Size multiplier
      if (item.size === 'Personal') itemPrice *= 0.8;
      if (item.size === 'Large') itemPrice *= 1.3;

      itemPrice = Math.round(itemPrice); // round to neat integers
      
      // Update item price to backend calculation
      item.price = itemPrice * item.quantity;
      calculatedSubtotal += item.price;
    }

    // 2. Apply Coupon
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && coupon.expiryDate > Date.now() && calculatedSubtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'percentage') {
          discountAmount = (calculatedSubtotal * coupon.value) / 100;
        } else {
          discountAmount = coupon.value;
        }
        discountAmount = Math.min(discountAmount, calculatedSubtotal); // Coupon discount cannot exceed subtotal
      }
    }

    // 3. Tax and delivery charges
    const tax = Math.round((calculatedSubtotal - discountAmount) * 0.05); // 5% GST
    const deliveryCharge = calculatedSubtotal > 500 ? 0 : 50; // Free delivery above ₹500
    const grandTotal = Math.round(calculatedSubtotal - discountAmount + tax + deliveryCharge);

    // 4. Create Razorpay order (or simulate it if in simulator mode)
    const amountInPaise = grandTotal * 100;
    const receiptId = `rcpt_${crypto.randomBytes(8).toString('hex')}`;

    if (razorpayInstance) {
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId
      };
      const razorpayOrder = await razorpayInstance.orders.create(options);
      
      return res.status(200).json({
        isMock: false,
        key: process.env.RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: receiptId,
        calculatedDetails: {
          items,
          subtotal: calculatedSubtotal,
          discountAmount,
          tax,
          deliveryCharge,
          grandTotal,
          deliveryAddress,
          couponCode
        }
      });
    } else {
      // Mock payment details for simulation testing
      const mockOrderId = `order_${crypto.randomBytes(12).toString('hex')}`;
      return res.status(200).json({
        isMock: true,
        key: 'rzp_test_dummykeyid12345',
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        calculatedDetails: {
          items,
          subtotal: calculatedSubtotal,
          discountAmount,
          tax,
          deliveryCharge,
          grandTotal,
          deliveryAddress,
          couponCode
        }
      });
    }
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      calculatedDetails,
      isMock
    } = req.body;

    if (!razorpay_order_id || !calculatedDetails) {
      return res.status(400).json({ message: 'Required payment details missing' });
    }

    // 1. Verify cryptographic signature if using real Razorpay
    if (razorpayInstance && !isMock) {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed: Signature mismatch' });
      }
    } else {
      console.log('Verifying simulated payment for order:', razorpay_order_id);
    }

    // 2. Reduce Inventory Stock
    // We deduct bases, sauces, cheese, veggies, and meats chosen in order items
    for (const item of calculatedDetails.items) {
      const quantity = item.quantity;
      
      // Base
      await Ingredient.updateOne({ name: item.base }, { $inc: { stock: -quantity } });
      // Sauce
      await Ingredient.updateOne({ name: item.sauce }, { $inc: { stock: -quantity } });
      // Cheese
      await Ingredient.updateOne({ name: item.cheese }, { $inc: { stock: -quantity } });
      
      // Veggies
      if (item.veggies && item.veggies.length > 0) {
        await Ingredient.updateMany({ name: { $in: item.veggies } }, { $inc: { stock: -quantity } });
      }
      
      // Meats
      if (item.meats && item.meats.length > 0) {
        await Ingredient.updateMany({ name: { $in: item.meats } }, { $inc: { stock: -quantity } });
      }
    }

    // 3. Create the Database Order Record
    const orderCustomId = `PIZZA-${Date.now().toString().slice(-6)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const order = await Order.create({
      orderId: orderCustomId,
      user: req.user._id,
      items: calculatedDetails.items,
      totalAmount: calculatedDetails.subtotal,
      tax: calculatedDetails.tax,
      deliveryCharge: calculatedDetails.deliveryCharge,
      grandTotal: calculatedDetails.grandTotal,
      couponApplied: calculatedDetails.couponCode || '',
      discountAmount: calculatedDetails.discountAmount,
      paymentStatus: 'paid',
      paymentDetails: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id || `pay_${crypto.randomBytes(8).toString('hex')}`,
        razorpaySignature: razorpay_signature || 'mock_signature'
      },
      orderStatus: 'received',
      deliveryAddress: calculatedDetails.deliveryAddress,
      estimatedDeliveryTime: new Date(Date.now() + 40 * 60000) // 40 mins estimation
    });

    // 4. Send Confirmation Email
    await sendOrderConfirmationEmail(req.user.email, req.user.name, order);

    // 5. Send Real-Time Alert notification to Admins
    const newOrderNotification = await Notification.create({
      user: null, // Admin alert
      title: '🍕 New Order Received',
      message: `Order ${orderCustomId} placed by ${req.user.name} for ₹${order.grandTotal}`,
      type: 'order'
    });

    sendToAdmins('newOrder', order);
    sendToAdmins('newNotification', newOrderNotification);

    res.status(201).json({
      message: 'Payment verified and order placed successfully!',
      orderId: order.orderId
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Fetch user orders error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id }).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    // Check access
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error('Fetch order details error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.adminGetOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort('-createdAt');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Admin fetch orders error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status, estimatedDeliveryTime } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const order = await Order.findOne({ orderId: req.params.id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.orderStatus = status;
    if (estimatedDeliveryTime) {
      order.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
    }
    await order.save();

    // 1. Emit live status to the socket tracking room
    updateOrderTracking(order.orderId, order.orderStatus, order.estimatedDeliveryTime);

    // 2. Create user specific notification in database
    const statusTitles = {
      kitchen: '🍳 Pizza In Kitchen',
      baking: '🔥 Baking Your Pizza',
      packaging: '📦 Packing Delicacies',
      shipping: '🚴 Out For Delivery',
      delivered: '🎉 Delivered!'
    };
    
    const statusMessages = {
      kitchen: `Your order ${order.orderId} is being prepared in the kitchen.`,
      baking: `Chef has put your pizza in the oven. Crinkle crusts cooking!`,
      packaging: `Your pizza is baked and is being packed hot.`,
      shipping: `Valet is out for delivery with your warm box!`,
      delivered: `Order ${order.orderId} was delivered. Enjoy your meal!`
    };

    const userNotif = await Notification.create({
      user: order.user,
      title: statusTitles[status] || 'Order Status Updated',
      message: statusMessages[status] || `Your order ${order.orderId} status has changed to ${status}`,
      type: 'order'
    });

    // 3. Emit user notification directly
    sendToUser(order.user, 'newNotification', userNotif);

    res.status(200).json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
