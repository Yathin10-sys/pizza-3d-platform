import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './redux/slices/authSlice';
import { useSocket } from './hooks/useSocket';

// Icons
import { Pizza, ShoppingBag, User, LogOut, Shield, Bell, Menu, X, Sun, Moon } from 'lucide-react';

// Pages (We will build these in subsequent steps)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Customizer from './pages/Customizer';
import Cart from './pages/Cart';
import OrderTracking from './pages/OrderTracking';
import AdminDashboard from './pages/AdminDashboard';
import MyOrders from './pages/MyOrders';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);

  // States
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Toggle Dark/Light Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle toast popup trigger
  const addToast = useCallback((notif) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, ...notif }]);
    setNotifications((prev) => [notif, ...prev]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Initialize socket hook
  const { joinOrderTracking, leaveOrderTracking } = useSocket(addToast);

  const handleLogout = () => {
    dispatch(logout());
    setMobileMenuOpen(false);
    navigate('/');
  };

  // Close menus on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotifDropdownOpen(false);
  }, [location.pathname]);

  const cartCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-panel border-b transition-all duration-300" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2 text-2xl font-bold font-heading tracking-wider text-orange-500">
                <Pizza className="h-8 w-8 text-orange-500 animate-pulse-slow" />
                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 bg-clip-text text-transparent">Slice & Spark</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="text-sm font-medium hover:text-orange-500 transition-colors theme-text-secondary">Catalog</Link>
                  <Link to="/customize" className="text-sm font-medium hover:text-orange-500 transition-colors theme-text-secondary">3D Customizer</Link>
                  <Link to="/my-orders" className="text-sm font-medium hover:text-orange-500 transition-colors theme-text-secondary">My Orders</Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin/dashboard" className="flex items-center space-x-1 text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors">
                      <Shield className="h-4 w-4" />
                      <span>Admin Portal</span>
                    </Link>
                  )}
                </>
              ) : (
                <Link to="/" className="text-sm font-medium hover:text-orange-500 transition-colors theme-text-secondary">Home</Link>
              )}
            </nav>

            {/* Utility Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Theme Toggle */}
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border-subtle)] transition-all"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
              </button>

              {isAuthenticated ? (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <button 
                      onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                      className="p-2 rounded-full hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border-subtle)] transition-all relative"
                    >
                      <Bell className="h-5 w-5 theme-text-secondary" />
                      {notifications.some(n => !n.isRead) && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[var(--card-bg)] animate-ping"></span>
                      )}
                    </button>
                    {/* Dropdown */}
                    {notifDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-80 glass-panel rounded-xl overflow-hidden shadow-2xl py-2 border text-sm" style={{ borderColor: 'var(--border-medium)' }}>
                        <div className="px-4 py-2 border-b font-bold flex justify-between items-center theme-text-primary" style={{ borderColor: 'var(--border-subtle)' }}>
                          <span>Notifications</span>
                          <button onClick={() => setNotifications([])} className="text-xs text-orange-500 hover:underline">Clear all</button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs theme-text-muted">No new notifications</div>
                          ) : (
                            notifications.map((notif, index) => (
                              <div key={index} className="px-4 py-3 hover:bg-[var(--surface)] border-b last:border-b-0" style={{ borderColor: 'var(--border-subtle)' }}>
                                <div className="font-semibold theme-text-heading">{notif.title}</div>
                                <div className="text-xs theme-text-muted mt-0.5">{notif.message}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cart */}
                  <Link to="/cart" className="p-2 rounded-full hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border-subtle)] transition-all relative">
                    <ShoppingBag className="h-5 w-5 theme-text-secondary" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  {/* User Profile */}
                  <div className="flex items-center space-x-2 pl-2 border-l" style={{ borderColor: 'var(--border-medium)' }}>
                    <div className="h-8 w-8 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold">
                      {user?.name[0].toUpperCase()}
                    </div>
                    <div className="text-left text-xs leading-none">
                      <div className="font-semibold theme-text-primary">{user?.name}</div>
                      <div className="theme-text-muted mt-0.5">{user?.role}</div>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="p-1.5 rounded-full hover:bg-red-500/10 theme-text-muted hover:text-red-500 transition-colors ml-2"
                      title="Log Out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-[var(--surface)] transition-all theme-text-secondary">Sign In</Link>
                  <Link to="/register" className="glass-btn px-4 py-2 text-sm font-semibold rounded-lg">Register</Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-full hover:bg-[var(--surface)]"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-[var(--surface)] border" style={{ borderColor: 'var(--border-subtle)' }}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-b px-4 pt-2 pb-6 space-y-4" style={{ borderColor: 'var(--border-subtle)' }}>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="block px-3 py-2 rounded-lg text-base font-medium hover:bg-[var(--surface)]">Catalog</Link>
                <Link to="/customize" className="block px-3 py-2 rounded-lg text-base font-medium hover:bg-[var(--surface)]">3D Customizer</Link>
                <Link to="/my-orders" className="block px-3 py-2 rounded-lg text-base font-medium hover:bg-[var(--surface)]">My Orders</Link>
                <Link to="/cart" className="block px-3 py-2 rounded-lg text-base font-medium hover:bg-[var(--surface)] flex justify-between items-center">
                  <span>My Cart</span>
                  {cartCount > 0 && <span className="bg-orange-600 px-2.5 py-0.5 rounded-full text-xs font-bold text-white">{cartCount}</span>}
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" className="block px-3 py-2 rounded-lg text-base font-medium text-amber-500 hover:bg-[var(--surface)]">Admin Portal</Link>
                )}
                <hr className="my-2" style={{ borderColor: 'var(--border-subtle)' }} />
                <div className="flex items-center space-x-3 px-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-lg">
                    {user?.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold theme-text-primary">{user?.name}</div>
                    <div className="text-xs theme-text-muted">{user?.email}</div>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 font-semibold"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <div className="space-y-3 pt-2">
                <Link to="/login" className="block w-full text-center py-2 px-4 rounded-lg bg-[var(--surface)] font-semibold">Sign In</Link>
                <Link to="/register" className="block w-full text-center py-2 px-4 rounded-lg glass-btn font-semibold">Register</Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Pages Canvas Area */}
      <main className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Protected Routes would normally go here, simplified pathing */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customize" element={<Customizer />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/track-order" element={<OrderTracking joinTrack={joinOrderTracking} leaveTrack={leaveOrderTracking} />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>

      {/* Toast Alert Notification Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`glass-panel border-l-4 p-4 rounded-lg shadow-xl flex items-start space-x-3 transform translate-y-0 transition-transform duration-300 ${
              toast.type === 'stock' ? 'border-red-500 bg-red-950/20' : 
              toast.type === 'order' ? 'border-orange-500 bg-orange-950/20' : 'border-blue-500'
            }`}
            style={{ background: toast.type === 'stock' ? undefined : toast.type === 'order' ? undefined : 'var(--card-bg)' }}
          >
            <Bell className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
              toast.type === 'stock' ? 'text-red-400 animate-bounce' : 
              toast.type === 'order' ? 'text-orange-400' : 'text-blue-400'
            }`} />
            <div>
              <h4 className="font-bold text-sm theme-text-heading">{toast.title}</h4>
              <p className="text-xs theme-text-muted mt-1 leading-relaxed">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
