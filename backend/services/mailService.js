const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const hasConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
  if (hasConfig) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Generate Ethereal testing account automatically
    console.log('Generating Ethereal email test account for development...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log(`Ethereal email configured. User: ${testAccount.user}`);
  }
  return transporter;
};

const sendMail = async ({ to, subject, html }) => {
  try {
    const client = await getTransporter();
    const mailOptions = {
      from: '"Slice & Spark 3D Pizza" <no-reply@sliceandspark.com>',
      to,
      subject,
      html
    };

    const info = await client.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    
    // Log preview URL for Ethereal emails
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`✉️ Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error('Mail send error:', error);
  }
};

const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #ff5722; text-align: center;">Welcome to Slice & Spark!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering at Slice & Spark 3D Pizza platform. To activate your account, please verify your email by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #ff5722; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
      </div>
      <p>If the button doesn't work, copy and paste this link in your browser:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888;">If you did not request this, please ignore this email.</p>
    </div>
  `;
  return await sendMail({ to: email, subject: 'Verify your Slice & Spark Account', html });
};

const sendWelcomeEmail = async (email, name) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #ff5722; text-align: center;">Registration Successful! 🎉</h2>
      <p>Hello ${name},</p>
      <p>Your email has been successfully verified! Welcome to our family of pizza enthusiasts.</p>
      <p>Get ready to design your own custom 3D pizzas, customize toppings in real time, and track your order live from kitchen to doorstep.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Order Pizza</a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888;">Happy Pizza Crafting! <br />Slice & Spark Team</p>
    </div>
  `;
  return await sendMail({ to: email, subject: 'Welcome to Slice & Spark 3D Pizza!', html });
};

const sendResetPasswordEmail = async (email, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #ff5722; text-align: center;">Reset Your Password</h2>
      <p>Hello ${name},</p>
      <p>You requested a password reset. Please click the button below to set a new password. This link is valid for 1 hour.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #ff5722; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888;">Slice & Spark Support</p>
    </div>
  `;
  return await sendMail({ to: email, subject: 'Password Reset Request - Slice & Spark', html });
};

const sendOrderConfirmationEmail = async (email, name, order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong> (${item.size})<br/>
        <span style="font-size: 12px; color: #666;">Crust: ${item.base}, Sauce: ${item.sauce}, Cheese: ${item.cheese}</span>
        ${item.veggies.length > 0 ? `<br/><span style="font-size: 11px; color: #888;">Veggies: ${item.veggies.join(', ')}</span>` : ''}
        ${item.meats.length > 0 ? `<br/><span style="font-size: 11px; color: #888;">Meats: ${item.meats.join(', ')}</span>` : ''}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4caf50; text-align: center;">Order Confirmed! 🍕</h2>
      <p>Hello ${name},</p>
      <p>Thank you for your order! We are preparing it in our kitchen now. Your Order ID is: <strong>${order.orderId}</strong></p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f8f8f8;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd; width: 60px;">Qty</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd; width: 100px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">Subtotal:</td>
            <td style="padding: 8px; text-align: right;">₹${order.totalAmount.toFixed(2)}</td>
          </tr>
          ${order.discountAmount > 0 ? `
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold; color: green;">Discount:</td>
            <td style="padding: 8px; text-align: right; color: green;">-₹${order.discountAmount.toFixed(2)}</td>
          </tr>` : ''}
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">Tax & Charges:</td>
            <td style="padding: 8px; text-align: right;">₹${order.tax.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">Delivery:</td>
            <td style="padding: 8px; text-align: right;">₹${order.deliveryCharge.toFixed(2)}</td>
          </tr>
          <tr style="font-size: 16px; font-weight: bold;">
            <td colspan="2" style="padding: 8px; text-align: right; border-top: 2px solid #ddd;">Grand Total:</td>
            <td style="padding: 8px; text-align: right; border-top: 2px solid #ddd; color: #ff5722;">₹${order.grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div style="background-color: #fcfcfc; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h4 style="margin: 0 0 10px 0;">Delivery Address:</h4>
        <p style="margin: 0; font-size: 14px; color: #555;">
          ${order.deliveryAddress.street}<br/>
          ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}<br/>
          Phone: ${order.deliveryAddress.phone}
        </p>
      </div>

      <p style="text-align: center; margin: 20px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/track-order?id=${order.orderId}" style="background-color: #ff5722; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Order Live</a>
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888; text-align: center;">Enjoy your warm slice! <br />Slice & Spark Team</p>
    </div>
  `;
  return await sendMail({ to: email, subject: `Order Confirmed: ${order.orderId} - Slice & Spark`, html });
};

const sendStockAlertEmail = async (email, items) => {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${item.name}</strong> (${item.type})</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; color: red;">${item.stock} units</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.threshold} units</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold; color: green;">100 units</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #d32f2f; text-align: center;">🚨 Inventory Warning Alert 🚨</h2>
      <p>Hello Admin,</p>
      <p>The following inventory items have fallen below their restock threshold (< 20 units). Please check current stock counts and initiate a restock order:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f8f8f8;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Item Name</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Current Stock</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Threshold</th>
            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Rec. Restock Qty</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/inventory" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Admin Inventory Manager</a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888;">System Automatic Alert - Slice & Spark Server Daemon</p>
    </div>
  `;
  return await sendMail({ to: email, subject: '🚨 Low Stock Alert: Restock Immediately - Slice & Spark', html });
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendOrderConfirmationEmail,
  sendStockAlertEmail
};
