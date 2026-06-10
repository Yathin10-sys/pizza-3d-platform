import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { Package, Clock, CheckCircle, Truck, ChefHat, Eye, Calendar, IndianRupee } from 'lucide-react';

export default function MyOrders() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/my-orders');
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'received':
        return <Clock className="h-5 w-5 text-amber-400" />;
      case 'kitchen':
      case 'baking':
        return <ChefHat className="h-5 w-5 text-orange-400" />;
      case 'packaging':
        return <Package className="h-5 w-5 text-blue-400" />;
      case 'shipping':
        return <Truck className="h-5 w-5 text-indigo-400" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'received':
        return 'bg-amber-500/10 border-amber-500/35 text-amber-400';
      case 'kitchen':
      case 'baking':
        return 'bg-orange-500/10 border-orange-500/35 text-orange-400';
      case 'packaging':
        return 'bg-blue-500/10 border-blue-500/35 text-blue-400';
      case 'shipping':
        return 'bg-indigo-500/10 border-indigo-500/35 text-indigo-400';
      case 'delivered':
        return 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400';
      default:
        return 'bg-slate-500/10 border-slate-500/35 text-slate-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'received':
        return 'Order Received';
      case 'kitchen':
        return 'In Kitchen';
      case 'baking':
        return 'Baking in Oven';
      case 'packaging':
        return 'Packaging';
      case 'shipping':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <span className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-sm text-slate-400">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight">My Orders</h1>
        <p className="text-xs text-slate-400 mt-1">Track and view all your pizza orders</p>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-white/5 p-12 text-center">
          <Package className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold theme-text-heading mb-2">No Orders Yet</h3>
          <p className="text-sm text-slate-400 mb-6">You haven't placed any orders. Start building your perfect pizza!</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="glass-btn px-6 py-3 rounded-xl font-bold"
          >
            Browse Pizzas
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div 
              key={order._id} 
              className="glass-panel glass-panel-hover rounded-2xl overflow-hidden border border-white/5"
            >
              {/* Order Header */}
              <div className="p-6 border-b border-white/5 bg-slate-900/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                      {getStatusIcon(order.orderStatus)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="font-heading font-extrabold text-lg">Order #{order.orderId}</h3>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border capitalize ${getStatusColor(order.orderStatus)}`}>
                          {getStatusText(order.orderStatus)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Amount</div>
                      <div className="text-2xl font-extrabold text-orange-500 font-heading flex items-center">
                        <IndianRupee className="h-5 w-5" />
                        <span>{order.grandTotal}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/track-order?id=${order.orderId}`)}
                      className="glass-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Track</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Order Items</h4>
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-white/5">
                      <div className="flex-grow">
                        <div className="font-bold theme-text-heading">{item.name}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {item.isCustom ? (
                            <span className="text-orange-400">Custom Pizza</span>
                          ) : (
                            <span>Pre-configured</span>
                          )}
                          {' • '}
                          <span>Size: {item.size}</span>
                        </div>
                        {item.veggies && item.veggies.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-1">
                            {item.veggies.map((v, i) => (
                              <span key={i} className="bg-white/5 px-1.5 py-0.5 rounded">{v}</span>
                            ))}
                            {item.meats && item.meats.length > 0 && item.meats.map((m, i) => (
                              <span key={i} className="bg-red-500/10 px-1.5 py-0.5 rounded text-red-400">{m}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xs text-slate-400">Qty: {item.quantity}</div>
                        <div className="font-bold theme-text-heading flex items-center">
                          <IndianRupee className="h-4 w-4" />
                          <span>{item.price * item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-3.5 w-3.5" />
                      <span>{order.subTotal}</span>
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Taxes & Fees</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-3.5 w-3.5" />
                      <span>{order.taxes}</span>
                    </span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount</span>
                      <span className="flex items-center">
                        - <IndianRupee className="h-3.5 w-3.5" />
                        <span>{order.discount}</span>
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold theme-text-heading text-sm pt-2 border-t border-white/5">
                    <span>Grand Total</span>
                    <span className="text-orange-500 flex items-center">
                      <IndianRupee className="h-4 w-4" />
                      <span>{order.grandTotal}</span>
                    </span>
                  </div>
                </div>

                {/* Delivery Address */}
                {order.address && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Delivery Address</h4>
                    <div className="text-xs text-slate-300">
                      <p>{order.address.street}</p>
                      <p>{order.address.city}, {order.address.state} - {order.address.postalCode}</p>
                      {order.address.phone && <p className="mt-1">Phone: {order.address.phone}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
