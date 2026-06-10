<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Three.js-r164-000000?style=for-the-badge&logo=threedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
</p>

# 🍕 Slice & Spark — 3D Pizza Ordering & Inventory Platform

A full-stack pizza ordering platform featuring an **interactive 3D pizza customizer** built with React Three Fiber, real-time order tracking via WebSockets, a complete admin dashboard with inventory management, and integrated payment processing.

---

## ✨ Features

### 🎨 Customer Experience
- **Interactive 3D Pizza Builder** — Build your pizza in real-time 3D. Choose crust, sauce, cheese, veggies, and meats and watch toppings animate onto a procedurally generated pizza model.
- **Preconfigured Menu Catalog** — Browse curated signature pizzas (Margherita, Pepperoni Feast, Meat Lovers BBQ, etc.) with Unsplash imagery.
- **Shopping Cart** — Add custom or catalog pizzas, adjust quantities, apply coupon codes, and view itemized pricing with tax and delivery breakdowns.
- **Live Order Tracking** — Track order status transitions (Placed → Confirmed → Preparing → Baking → Out for Delivery → Delivered) in real-time via Socket.io.
- **Order History** — View all past orders with full details and status.
- **Dark / Light Theme** — Toggle between dark and light modes, persisted to `localStorage`.

### 🔐 Authentication & Security
- **JWT Authentication** — Access + Refresh token pair stored securely, with role-based access control (Customer / Admin).
- **Email Verification** — New accounts receive an email verification link. Supports Ethereal (dev) and SMTP (production).
- **Password Reset Flow** — Forgot Password → Email with time-limited reset link → Set new password.
- **Security Hardened** — Helmet headers, Express rate limiting (200 req / 15 min), Mongo injection sanitization, CORS whitelisting.
- **Joi Validation** — Server-side request validation on all auth and order endpoints.

### 🛡️ Admin Dashboard
- **Order Management** — View all orders, update statuses, which triggers real-time notifications to customers.
- **Inventory Manager** — Full CRUD on 30+ ingredient items (bases, sauces, cheeses, veggies, meats) with stock levels and restock thresholds.
- **Low Stock Alerts** — Hourly cron job monitors inventory; when items fall below threshold, admins receive:
  - In-app toast notifications via WebSocket
  - Database-persisted notification records
  - Email alerts with restock recommendations
- **Analytics Dashboard** — Revenue charts, order volume trends, and top-selling items powered by Recharts.
- **Product Catalog Management** — Add, edit, or remove menu items.

### 💳 Payments
- **Razorpay Integration** — Test-mode payment processing with order verification. Falls back to simulation mode when using dummy credentials.

### 📧 Transactional Emails
- Email Verification, Welcome, Password Reset, Order Confirmation, and Stock Alert emails — all with branded HTML templates.
- Auto-configures [Ethereal](https://ethereal.email/) test accounts in development if no SMTP credentials are provided.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TailwindCSS 3 |
| **3D Engine** | Three.js, React Three Fiber, Drei |
| **State Management** | Redux Toolkit, React-Redux |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Backend** | Node.js, Express 4 |
| **Database** | MongoDB Atlas, Mongoose 8 |
| **Real-time** | Socket.io (server + client) |
| **Auth** | JWT (access + refresh), bcryptjs |
| **Payments** | Razorpay SDK |
| **Email** | Nodemailer (Ethereal / SMTP) |
| **Scheduling** | node-cron |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize |
| **Validation** | Joi |
| **Testing** | Jest, Supertest |

---

## 📁 Project Structure

```
pizza-3d-platform/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection setup
│   ├── controllers/
│   │   ├── analyticsController.js # Revenue & order analytics
│   │   ├── authController.js      # Register, login, verify, reset
│   │   ├── inventoryController.js # Ingredient CRUD & stock mgmt
│   │   ├── orderController.js     # Order lifecycle & payments
│   │   └── productController.js   # Menu catalog CRUD
│   ├── middleware/
│   │   └── auth.js                # JWT verification & role guard
│   ├── models/
│   │   ├── Coupon.js              # Discount codes (flat/percentage)
│   │   ├── Ingredient.js          # Customizer ingredients & stock
│   │   ├── Notification.js        # Admin notification records
│   │   ├── Order.js               # Order with items, address, payment
│   │   ├── PizzaBase.js           # Pizza base definitions
│   │   ├── Product.js             # Preconfigured menu pizzas
│   │   ├── Review.js              # Customer reviews
│   │   ├── Sauce.js               # Sauce definitions
│   │   └── User.js                # User with hashed password & roles
│   ├── routes/
│   │   ├── analyticsRoutes.js     # GET /api/analytics/*
│   │   ├── authRoutes.js          # POST /api/auth/*
│   │   ├── inventoryRoutes.js     # /api/inventory/*
│   │   ├── orderRoutes.js         # /api/orders/*
│   │   └── productRoutes.js       # /api/products/*
│   ├── services/
│   │   ├── cronService.js         # Hourly low-stock monitoring
│   │   ├── mailService.js         # Transactional email templates
│   │   └── socketService.js       # WebSocket event management
│   ├── validators/
│   │   └── schemas.js             # Joi validation schemas
│   ├── tests/
│   │   └── auth.test.js           # Auth endpoint tests
│   ├── .env.example               # Environment variable template
│   └── server.js                  # Express app entry + DB seeding
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Pizza3D/
│   │   │       ├── PizzaCanvas.jsx       # R3F Canvas + lighting
│   │   │       ├── PizzaModel.jsx        # Procedural 3D pizza mesh
│   │   │       └── ParticleBackground.jsx # Floating particle effects
│   │   ├── hooks/
│   │   │   └── useSocket.js       # Socket.io client hook
│   │   ├── pages/
│   │   │   ├── Landing.jsx        # Hero landing page
│   │   │   ├── Login.jsx          # Sign in form
│   │   │   ├── Register.jsx       # Registration with validation
│   │   │   ├── VerifyEmail.jsx    # Email verification handler
│   │   │   ├── ForgotPassword.jsx # Password reset request
│   │   │   ├── ResetPassword.jsx  # New password form
│   │   │   ├── Dashboard.jsx      # Pizza catalog browse
│   │   │   ├── Customizer.jsx     # 3D pizza builder
│   │   │   ├── Cart.jsx           # Cart + checkout + payment
│   │   │   ├── MyOrders.jsx       # Order history
│   │   │   ├── OrderTracking.jsx  # Real-time order tracker
│   │   │   └── AdminDashboard.jsx # Admin panel (orders/inventory/analytics)
│   │   ├── redux/
│   │   │   ├── store.js           # Redux store configuration
│   │   │   └── slices/
│   │   │       ├── authSlice.js      # Auth state & tokens
│   │   │       ├── cartSlice.js      # Cart items & operations
│   │   │       ├── inventorySlice.js  # Inventory state
│   │   │       └── orderSlice.js     # Order state
│   │   ├── utils/
│   │   │   └── api.js             # Axios instance with interceptors
│   │   ├── App.jsx                # Root layout, routing, navigation
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Global styles & theme variables
│   ├── index.html                 # HTML shell
│   ├── vite.config.js             # Vite configuration
│   ├── tailwind.config.js         # Tailwind theme extensions
│   └── postcss.config.js          # PostCSS plugins
│
├── package.json                   # Root monorepo scripts
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- A **MongoDB Atlas** cluster (or local MongoDB instance)

### 1. Clone the Repository

```bash
git clone https://github.com/Yathin10-sys/pizza-3d-platform.git
cd pizza-3d-platform
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/pizza-platform?retryWrites=true&w=majority

JWT_SECRET=your_secure_jwt_secret
JWT_REFRESH_SECRET=your_secure_refresh_secret
FRONTEND_URL=http://localhost:5173

# Email (leave blank to auto-generate Ethereal test account)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=

# Razorpay (use test keys, or leave dummy to use simulation mode)
RAZORPAY_KEY_ID=rzp_test_yourkeyid
RAZORPAY_KEY_SECRET=rzp_test_yoursecret
```

### 3. Install Dependencies

From the project root:

```bash
npm run install:all
```

This installs dependencies for both `backend/` and `frontend/`.

### 4. Start Development Servers

```bash
npm run dev
```

This starts both servers concurrently:

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:5000 |
| Health Check | http://localhost:5000/health |

### 5. First-Run Database Seeding

On first launch, the server automatically seeds:

| Data | Details |
|------|---------|
| **Admin Account** | `admin@sliceandspark.com` / `AdminPassword123` |
| **30+ Ingredients** | Bases, sauces, cheeses, veggies, and meats with stock levels |
| **5 Catalog Pizzas** | Margherita, Pepperoni Feast, Garden Veggie, Garlic Parmesan, Meat Lovers BBQ |
| **2 Coupon Codes** | `PIZZA50` (₹50 flat off ≥ ₹299) · `SLICE30` (30% off ≥ ₹499) |

---

## 📡 API Endpoints

### Authentication — `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login with email & password |
| GET | `/verify-email?token=` | Verify email address |
| POST | `/forgot-password` | Request password reset email |
| POST | `/reset-password` | Reset password with token |

### Products — `/api/products`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all catalog pizzas |
| POST | `/` | Add new product (Admin) |
| PUT | `/:id` | Update product (Admin) |
| DELETE | `/:id` | Delete product (Admin) |

### Orders — `/api/orders`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Place new order |
| GET | `/my-orders` | Get current user's orders |
| GET | `/all` | Get all orders (Admin) |
| PUT | `/:id/status` | Update order status (Admin) |
| POST | `/verify-payment` | Verify Razorpay payment |

### Inventory — `/api/inventory`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all ingredients |
| PUT | `/:id` | Update ingredient stock (Admin) |
| POST | `/` | Add new ingredient (Admin) |
| DELETE | `/:id` | Remove ingredient (Admin) |

### Analytics — `/api/analytics`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Dashboard analytics data (Admin) |

---

## 🔌 Real-Time Events (Socket.io)

| Event | Direction | Description |
|-------|-----------|-------------|
| `register` | Client → Server | Register user/admin socket session |
| `joinOrderTrack` | Client → Server | Subscribe to an order's live updates |
| `leaveOrderTrack` | Client → Server | Unsubscribe from order tracking |
| `statusUpdate` | Server → Client | Order status change broadcast |
| `newNotification` | Server → Admins | New notification alert |
| `lowStockAlert` | Server → Admins | Low inventory warning |

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test
```

Tests use **Jest** and **Supertest** for API endpoint validation.

---

## 🎮 3D Pizza Customizer — How It Works

The 3D pizza is rendered entirely with **procedural geometry** — no external 3D model files are needed.

1. **Crust** — A `CylinderGeometry` disc with a `TorusGeometry` lip ring, colored per base type.
2. **Sauce** — An animated cylinder that expands from center outward (spreading effect via `sauceProgress`).
3. **Cheese** — A cylinder layer with real-time scale animation to simulate melting and bubbling.
4. **Toppings** — Each topping type (Pepperoni, Mushroom, Olive, Paneer, etc.) is a unique procedural mesh (cylinders, spheres, tori, boxes) placed on pre-computed scatter coordinates across 3 concentric rings. Toppings animate in with a drop-down effect.

The scene includes `OrbitControls` for camera rotation/zoom, studio lighting, and a particle background effect.

---

## 🛣️ Roadmap

- [ ] Google / GitHub OAuth login
- [ ] Push notifications (Web Push API)
- [ ] Customer reviews & ratings per product
- [ ] Delivery agent tracking with map integration
- [ ] PWA support for mobile installation
- [ ] Production deployment guide (Vercel + Render / Railway)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Yathin**
- GitHub: [@Yathin10-sys](https://github.com/Yathin10-sys)
- Email: pyathin26@gmail.com
