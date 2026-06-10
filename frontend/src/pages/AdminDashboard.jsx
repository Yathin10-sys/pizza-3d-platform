import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import api from '../utils/api';

// Icons
import {
  TrendingUp, ShoppingBag, Clock, Users, ShieldAlert, Layers, Plus, Edit, Trash2,
  CheckCircle, FileDown, Eye, RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // States
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, orders, inventory
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inventory forms state
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('veggie');
  const [newItemPrice, setNewItemPrice] = useState(15);
  const [newItemStock, setNewItemStock] = useState(100);
  const [newItemThreshold, setNewItemThreshold] = useState(20);
  const [newItemColor, setNewItemColor] = useState('#ffffff');
  const [editItemId, setEditItemId] = useState(null);

  // Fetch Dashboard Stats & Queue
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/analytics/dashboard');
      setStats(statsRes.data);

      const ordersRes = await api.get('/orders/admin/all');
      setOrders(ordersRes.data);

      const invRes = await api.get('/inventory');
      setInventory(invRes.data);
    } catch (err) {
      console.error('Error fetching admin dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  // Handle order status update
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const { data } = await api.put(`/orders/admin/status/${orderId}`, { status: newStatus });
      
      // Update local state
      setOrders((prev) => 
        prev.map(o => o.orderId === orderId ? { ...o, orderStatus: newStatus } : o)
      );

      // Trigger custom event to sync local order trackers in separate windows
      const event = new CustomEvent('pizza_socket_status_update', { detail: { orderId, status: newStatus } });
      window.dispatchEvent(event);

      // Reload stats to verify revenue shifts
      const statsRes = await api.get('/analytics/dashboard');
      setStats(statsRes.data);
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.message || 'Error'));
    }
  };

  // Add Inventory Item
  const handleAddInventory = async (e) => {
    e.preventDefault();
    if (!newItemName) return;

    try {
      const { data } = await api.post('/inventory', {
        name: newItemName,
        type: newItemType,
        price: newItemPrice,
        stock: newItemStock,
        threshold: newItemThreshold,
        color: newItemColor
      });

      setInventory((prev) => [...prev, data.item]);
      
      // Reset form
      setNewItemName('');
      setNewItemPrice(15);
      setNewItemStock(100);
      setNewItemColor('#ffffff');

      // Refresh stats
      const statsRes = await api.get('/analytics/dashboard');
      setStats(statsRes.data);
    } catch (err) {
      alert('Error adding inventory: ' + (err.response?.data?.message || 'Error'));
    }
  };

  // Restock stock count helper
  const handleQuickRestock = async (itemId, currentStock) => {
    try {
      const { data } = await api.put(`/inventory/${itemId}`, { stock: currentStock + 100 });
      setInventory((prev) => 
        prev.map(item => item._id === itemId ? data.item : item)
      );

      // Refresh stats
      const statsRes = await api.get('/analytics/dashboard');
      setStats(statsRes.data);
    } catch (err) {
      alert('Restock failed: ' + (err.response?.data?.message || 'Error'));
    }
  };

  // Delete Inventory Item
  const handleDeleteInventory = async (itemId) => {
    if (!window.confirm('Delete this item from customizer menu?')) return;
    try {
      await api.delete(`/inventory/${itemId}`);
      setInventory((prev) => prev.filter(item => item._id !== itemId));
    } catch (err) {
      alert('Delete failed');
    }
  };

  // Export Sales CSV
  const handleExportCSV = async () => {
    try {
      const response = await api.get('/analytics/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('CSV export failed');
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <span className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-sm text-slate-400">Loading admin operations command center...</p>
        </div>
      </div>
    );
  }

  // Find low stock items to render warnings
  const lowStockList = inventory.filter(item => item.stock < item.threshold);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full space-y-8">
      
      {/* 1. Low Stock Warn Banner */}
      {lowStockList.length > 0 && (
        <div className="p-4 bg-red-950/20 border border-red-500/35 rounded-2xl flex items-start space-x-3.5 animate-bounce">
          <ShieldAlert className="h-6 w-6 text-red-500 flex-shrink-0" />
          <div className="text-xs">
            <h4 className="font-bold text-red-400 text-sm">🚨 Low Stock Threshold Warnings</h4>
            <p className="text-slate-400 mt-1">The following customizer components have fallen below limits: <span className="font-bold text-slate-300">{lowStockList.map(i => `${i.name} (${i.stock} left)`).join(', ')}</span>. Please restock immediately.</p>
          </div>
        </div>
      )}

      {/* 2. Admin Header Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading">Command Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time charts analytics, orders progression, and ingredient stocks</p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-bold">
          <button 
            onClick={fetchDashboardData}
            className="p-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl flex items-center space-x-1.5 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Sync</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="p-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center space-x-1.5 transition-all"
          >
            <FileDown className="h-4 w-4" />
            <span>Export Sales CSV</span>
          </button>
        </div>
      </div>

      {/* 3. Stat Card Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4 border border-white/5">
          <div className="p-3.5 bg-orange-500/10 text-orange-500 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Sales</span>
            <div className="text-2xl font-extrabold text-slate-200 mt-0.5">₹{stats.summary.totalRevenue}</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4 border border-white/5">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Orders</span>
            <div className="text-2xl font-extrabold text-slate-200 mt-0.5">{stats.summary.totalOrders}</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4 border border-white/5">
          <div className="p-3.5 bg-yellow-500/10 text-yellow-500 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Queue</span>
            <div className="text-2xl font-extrabold text-slate-200 mt-0.5">{stats.summary.pendingOrders}</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4 border border-white/5">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Users Joined</span>
            <div className="text-2xl font-extrabold text-slate-200 mt-0.5">{stats.summary.activeUsers}</div>
          </div>
        </div>
      </div>

      {/* Tab Switchers */}
      <div className="flex border-b border-white/5 space-x-6 text-sm font-bold">
        {['analytics', 'orders', 'inventory'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 border-b-2 transition-all capitalize ${
              activeTab === tab ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      {/* A. ANALYTICS GRAPHS PANEL */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sales trend line graph */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 lg:col-span-2 space-y-4">
            <h3 className="font-heading font-extrabold text-lg text-slate-200">Revenue & Ordering Trends (Last 7 Days)</h3>
            <div className="h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueTrends}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff5722" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff5722" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis yAxisId="left" stroke="#ff5722" />
                  <YAxis yAxisId="right" orientation="right" stroke="#6366f1" />
                  <Tooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#ff5722" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} />
                  <Area yAxisId="right" type="monotone" dataKey="orders" name="Order count" stroke="#6366f1" fillOpacity={0} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pizza popularity chart */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="font-heading font-extrabold text-lg text-slate-200">Popular Signature Pizzas</h3>
            <div className="h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topPizzas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis dataKey="name" type="category" stroke="#64748b" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="quantity" name="Quantity Sold" fill="#ff7043" radius={[0, 4, 4, 0]}>
                    {stats.topPizzas.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ff5722' : '#ff7043'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* B. ACTIVE ORDER QUEUE */}
      {activeTab === 'orders' && (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden text-xs">
          <div className="px-6 py-4 border-b border-white/5 font-extrabold text-slate-200 font-heading text-sm">
            Pending Kitchen & Delivery Orders
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-white/5 font-bold text-slate-400">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Milestone Status</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Progression Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">No active orders in queue</td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold text-slate-200">{order.orderId}</td>
                      <td className="p-4">
                        <div className="font-semibold">{order.user?.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{order.user?.email}</div>
                      </td>
                      <td className="p-4 font-bold text-orange-500">₹{order.grandTotal}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                          order.orderStatus === 'delivered' ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400' :
                          order.orderStatus === 'shipping' ? 'bg-blue-500/10 border-blue-500/35 text-blue-400' : 'bg-orange-500/10 border-orange-500/35 text-orange-400'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="truncate text-slate-400">{order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</div>
                      </td>
                      <td className="p-4 flex items-center space-x-2">
                        {order.orderStatus !== 'delivered' ? (
                          <div className="flex space-x-1.5">
                            {order.orderStatus === 'received' && (
                              <button 
                                onClick={() => handleUpdateStatus(order.orderId, 'kitchen')}
                                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/20 rounded font-bold transition-all text-[10px]"
                              >
                                Send to Kitchen
                              </button>
                            )}
                            {order.orderStatus === 'kitchen' && (
                              <button 
                                onClick={() => handleUpdateStatus(order.orderId, 'baking')}
                                className="px-2 py-1 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/20 rounded font-bold transition-all text-[10px]"
                              >
                                Put in Oven
                              </button>
                            )}
                            {order.orderStatus === 'baking' && (
                              <button 
                                onClick={() => handleUpdateStatus(order.orderId, 'packaging')}
                                className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 rounded font-bold transition-all text-[10px]"
                              >
                                Box Pizza
                              </button>
                            )}
                            {order.orderStatus === 'packaging' && (
                              <button 
                                onClick={() => handleUpdateStatus(order.orderId, 'shipping')}
                                className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 rounded font-bold transition-all text-[10px]"
                              >
                                Hand to Rider
                              </button>
                            )}
                            {order.orderStatus === 'shipping' && (
                              <button 
                                onClick={() => handleUpdateStatus(order.orderId, 'delivered')}
                                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded font-bold transition-all text-[10px]"
                              >
                                Confirm Delivery
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 flex items-center space-x-0.5">
                            <CheckCircle className="h-3 w-3 text-emerald-400" />
                            <span>Completed</span>
                          </span>
                        )}
                        <Link 
                          to={`/track-order?id=${order.orderId}`}
                          className="p-1 hover:bg-white/5 border border-transparent hover:border-white/5 rounded text-slate-400 hover:text-white"
                          title="View Live Tracker"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* C. INVENTORY STOCKS & CRUD */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Table display */}
          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden lg:col-span-2 text-xs">
            <div className="px-6 py-4 border-b border-white/5 font-extrabold text-slate-200 font-heading text-sm flex justify-between items-center">
              <span>Bases, Sauces, and Toppings List</span>
              <button 
                onClick={async () => {
                  await api.post('/inventory/check-thresholds');
                  alert('Inventory stock monitors scanned.');
                }}
                className="px-2.5 py-1 text-[10px] font-bold border border-white/5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
              >
                Scan Thresholds
              </button>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-white/5 font-bold text-slate-400">
                    <th className="p-4">Ingredient Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Additional Cost</th>
                    <th className="p-4">Stock Level</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inventory.map(item => {
                    const isLow = item.stock < item.threshold;
                    return (
                      <tr key={item._id} className={`hover:bg-white/5 transition-colors ${isLow ? 'bg-red-500/5' : ''}`}>
                        <td className="p-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="h-3 w-3 rounded-full border border-white/10" style={{ backgroundColor: item.color }}></div>
                            <span className="font-bold text-slate-200">{item.name}</span>
                          </div>
                        </td>
                        <td className="p-4 capitalize">{item.type}</td>
                        <td className="p-4 font-semibold text-slate-400">₹{item.price}</td>
                        <td className="p-4">
                          <span className={`font-bold ${isLow ? 'text-red-400' : 'text-slate-300'}`}>{item.stock} units</span>
                          {isLow && <span className="text-[9px] block text-red-500 font-semibold mt-0.5">Below Threshold!</span>}
                        </td>
                        <td className="p-4 flex items-center space-x-1.5">
                          <button 
                            onClick={() => handleQuickRestock(item._id, item.stock)}
                            className="px-2 py-1 bg-white/5 border border-white/5 hover:bg-white/10 rounded font-bold text-[10px] transition-all"
                            title="Restock 100 units"
                          >
                            +100 Restock
                          </button>
                          <button 
                            onClick={() => handleDeleteInventory(item._id)}
                            className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                            title="Delete Item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Form */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 h-fit text-xs space-y-4">
            <h3 className="font-heading font-extrabold text-sm text-slate-200 flex items-center space-x-1">
              <Plus className="h-4 w-4 text-orange-500" />
              <span>Add Customizer Ingredient</span>
            </h3>

            <form onSubmit={handleAddInventory} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Item Name</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 rounded-lg"
                  placeholder="e.g. Avocado slices"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Type</label>
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value)}
                    className="glass-input w-full px-3 py-2.5 rounded-lg text-slate-400 focus:text-slate-200 cursor-pointer"
                  >
                    <option value="base">Base Crust</option>
                    <option value="sauce">Sauce</option>
                    <option value="cheese">Cheese</option>
                    <option value="veggie">Veggies</option>
                    <option value="meat">Meat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Cost (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(parseInt(e.target.value))}
                    className="glass-input w-full px-3 py-2.5 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Starting Stock</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(parseInt(e.target.value))}
                    className="glass-input w-full px-3 py-2.5 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Warning Min</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={newItemThreshold}
                    onChange={(e) => setNewItemThreshold(parseInt(e.target.value))}
                    className="glass-input w-full px-3 py-2.5 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">3D Render Color (Hex)</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={newItemColor}
                    onChange={(e) => setNewItemColor(e.target.value)}
                    className="h-10 w-12 rounded border border-white/5 cursor-pointer bg-slate-900"
                  />
                  <input
                    type="text"
                    required
                    value={newItemColor}
                    onChange={(e) => setNewItemColor(e.target.value)}
                    className="glass-input flex-grow px-3 py-2.5 rounded-lg"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="glass-btn w-full py-3.5 rounded-xl font-bold flex items-center justify-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Component</span>
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
