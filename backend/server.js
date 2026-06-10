require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');
const { initCronJobs } = require('./services/cronService');

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Models for seeding
const User = require('./models/User');
const Ingredient = require('./models/Ingredient');
const Product = require('./models/Product');
const Coupon = require('./models/Coupon');

const app = express();
const server = http.createServer(app);

// 1. Initialize Sockets
initSocket(server);

// 2. Connect Database
connectDB().then(() => {
  seedDatabase();
});

// 3. Security Middlewares
app.use(helmet());
app.use(mongoSanitize());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// 4. CORS Setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// 5. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6. Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);

// Test endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 8. Cron Jobs
initCronJobs();

// 9. Database Seeding Logic
async function seedDatabase() {
  try {
    // A. Seed Admin User
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      console.log('Seeding default administrator account...');
      await User.create({
        name: 'Slice & Spark Admin',
        email: 'admin@sliceandspark.com',
        phone: '9999999999',
        password: 'AdminPassword123', // Will be hashed by mongoose pre-save hook
        role: 'admin',
        isVerified: true
      });
      console.log('Admin account seeded: admin@sliceandspark.com / AdminPassword123');
    }

    // B. Seed Customizer Ingredients
    const ingredientCount = await Ingredient.countDocuments();
    if (ingredientCount === 0) {
      console.log('Seeding customizer ingredients...');
      const defaultIngredients = [
        // Bases (Default price is for base 150)
        { name: 'Thin Crust', type: 'base', price: 0, stock: 100, threshold: 20, color: '#e5c185' },
        { name: 'Hand Tossed', type: 'base', price: 20, stock: 100, threshold: 20, color: '#ddb36a' },
        { name: 'Cheese Burst', type: 'base', price: 60, stock: 100, threshold: 20, color: '#ffd54f' },
        { name: 'Stuffed Crust', type: 'base', price: 50, stock: 100, threshold: 20, color: '#e0b570' },
        { name: 'Whole Wheat', type: 'base', price: 30, stock: 100, threshold: 20, color: '#b78b54' },

        // Sauces
        { name: 'Tomato Basil', type: 'sauce', price: 0, stock: 100, threshold: 20, color: '#c62828' },
        { name: 'BBQ Sauce', type: 'sauce', price: 15, stock: 100, threshold: 20, color: '#4e2710' },
        { name: 'Garlic Parmesan', type: 'sauce', price: 25, stock: 100, threshold: 20, color: '#faf0d7' },
        { name: 'Alfredo', type: 'sauce', price: 20, stock: 100, threshold: 20, color: '#fffdf5' },
        { name: 'Spicy Arrabbiata', type: 'sauce', price: 10, stock: 100, threshold: 20, color: '#b71c1c' },

        // Cheeses
        { name: 'Mozzarella', type: 'cheese', price: 30, stock: 100, threshold: 20, color: '#fff9c4' },
        { name: 'Cheddar', type: 'cheese', price: 40, stock: 100, threshold: 20, color: '#ffb74d' },
        { name: 'Parmesan', type: 'cheese', price: 45, stock: 100, threshold: 20, color: '#ffeb3b' },
        { name: 'Provolone', type: 'cheese', price: 35, stock: 100, threshold: 20, color: '#fffde7' },
        { name: 'Vegan Cheese', type: 'cheese', price: 50, stock: 100, threshold: 20, color: '#fcf3cf' },

        // Veggies
        { name: 'Onion', type: 'veggie', price: 15, stock: 100, threshold: 20, color: '#d7bde2' },
        { name: 'Capsicum', type: 'veggie', price: 15, stock: 100, threshold: 20, color: '#2e7d32' },
        { name: 'Mushroom', type: 'veggie', price: 20, stock: 100, threshold: 20, color: '#cfd8dc' },
        { name: 'Corn', type: 'veggie', price: 10, stock: 100, threshold: 20, color: '#fdd835' },
        { name: 'Jalapeño', type: 'veggie', price: 15, stock: 100, threshold: 20, color: '#1b5e20' },
        { name: 'Tomato', type: 'veggie', price: 10, stock: 100, threshold: 20, color: '#e53935' },
        { name: 'Olive', type: 'veggie', price: 20, stock: 100, threshold: 20, color: '#212121' },
        { name: 'Broccoli', type: 'veggie', price: 25, stock: 100, threshold: 20, color: '#4caf50' },
        { name: 'Spinach', type: 'veggie', price: 15, stock: 100, threshold: 20, color: '#81c784' },
        { name: 'Paneer', type: 'veggie', price: 30, stock: 100, threshold: 20, color: '#fcfcfc' },

        // Meats
        { name: 'Chicken', type: 'meat', price: 40, stock: 100, threshold: 20, color: '#fbe9e7' },
        { name: 'Pepperoni', type: 'meat', price: 50, stock: 100, threshold: 20, color: '#c62828' },
        { name: 'Sausage', type: 'meat', price: 45, stock: 100, threshold: 20, color: '#8d6e63' },
        { name: 'Bacon', type: 'meat', price: 55, stock: 100, threshold: 20, color: '#d84315' },
        { name: 'Ham', type: 'meat', price: 40, stock: 100, threshold: 20, color: '#ff8a80' }
      ];

      await Ingredient.insertMany(defaultIngredients);
      console.log('Seeded 30+ customizer ingredient base values.');
    }

    // C. Seed Preconfigured Menu Pizzas
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('Seeding preconfigured catalog pizzas...');
      const defaultProducts = [
        {
          name: 'Classic Margherita',
          description: 'A classic Italian masterpiece topped with tomato sauce, creamy melted mozzarella cheese, fresh tomatoes, and garden basil flakes.',
          basePrice: 220,
          category: 'Veg',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
          recipe: {
            base: 'Thin Crust',
            sauce: 'Tomato Basil',
            cheese: 'Mozzarella',
            veggies: ['Tomato'],
            meats: []
          }
        },
        {
          name: 'Spicy Pepperoni Feast',
          description: 'Double layer of spicy beef pepperoni, tomato sauce, provolone, and sharp mozzarella on hand tossed crust.',
          basePrice: 320,
          category: 'Non-Veg',
          tags: ['Popular', 'New'],
          image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
          recipe: {
            base: 'Hand Tossed',
            sauce: 'Spicy Arrabbiata',
            cheese: 'Mozzarella',
            veggies: ['Jalapeño'],
            meats: ['Pepperoni']
          }
        },
        {
          name: 'Garden Fresh Veggie',
          description: 'Loaded with crispy capsicum, juicy onions, tender mushrooms, sweet golden corn, and black olives over standard cheese blend.',
          basePrice: 280,
          category: 'Veg',
          tags: ['New'],
          image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&h=300&fit=crop',
          recipe: {
            base: 'Whole Wheat',
            sauce: 'Tomato Basil',
            cheese: 'Mozzarella',
            veggies: ['Capsicum', 'Onion', 'Mushroom', 'Corn', 'Olive'],
            meats: []
          }
        },
        {
          name: 'Cheesy Garlic Parmesan',
          description: 'White pizza base topped with garlic parmesan cream sauce, mozzarella, parmesan, provolone, paneer cubes, and spinach.',
          basePrice: 310,
          category: 'Veg',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&h=300&fit=crop',
          recipe: {
            base: 'Cheese Burst',
            sauce: 'Garlic Parmesan',
            cheese: 'Parmesan',
            veggies: ['Paneer', 'Spinach'],
            meats: []
          }
        },
        {
          name: 'Meat Lovers BBQ',
          description: 'For meat enthusiasts. Smoky BBQ sauce base, mozzarella, grilled chicken bits, diced bacon, ham, sausage crumbles, and red onions.',
          basePrice: 380,
          category: 'Non-Veg',
          tags: ['Popular'],
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
          recipe: {
            base: 'Stuffed Crust',
            sauce: 'BBQ Sauce',
            cheese: 'Mozzarella',
            veggies: ['Onion'],
            meats: ['Chicken', 'Bacon', 'Sausage', 'Ham']
          }
        }
      ];

      await Product.insertMany(defaultProducts);
      console.log('Seeded preconfigured menu catalog products.');
    }

    // D. Seed Test Coupons
    const couponCount = await Coupon.countDocuments();
    if (couponCount === 0) {
      console.log('Seeding discount coupons...');
      const defaultCoupons = [
        {
          code: 'PIZZA50',
          discountType: 'flat',
          value: 50,
          minOrderValue: 299,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 Days expiry
        },
        {
          code: 'SLICE30',
          discountType: 'percentage',
          value: 30,
          minOrderValue: 499,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ];

      await Coupon.insertMany(defaultCoupons);
      console.log('Seeded test coupons (PIZZA50 & SLICE30).');
    }

  } catch (err) {
    console.error('Seeding database error:', err);
  }
}

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = server; // Export for testing (supertest)
