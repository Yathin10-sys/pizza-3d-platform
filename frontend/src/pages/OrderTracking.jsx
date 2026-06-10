import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';

// Icons
import { Clock, CheckCircle2, ChevronRight, Home, CookingPot, Flame, Package, Truck, Smile } from 'lucide-react';

export default function OrderTracking({ joinTrack, leaveTrack }) {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch initial details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError('No Order ID provided in the URL');
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get(`/orders/track/${orderId}`);
        setOrder(data);
        // Join socket room
        joinTrack(orderId);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to retrieve order tracking details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();

    return () => {
      if (orderId) {
        leaveTrack(orderId);
      }
    };
  }, [orderId, joinTrack, leaveTrack]);

  // Bind local tracking hooks if status updates on the socket
  useEffect(() => {
    if (!orderId) return;

    // We can listen to custom socket messages internally or rely on App.jsx trigger + refetch.
    // To ensure 100% sync, let's create a local listener that queries order details or updates local state!
    const handleStatusSocketUpdate = () => {
      // Just re-fetch to make sure we load the exact schema updates correctly
      api.get(`/orders/track/${orderId}`)
        .then(({ data }) => setOrder(data))
        .catch(err => console.error(err));
    };

    // Normally useSocket wraps this. We can register standard window-level listeners or bind socket directly if exposed.
    // For local reliability, let's poll or wait for updates. Wait, useSocket in App.jsx triggers addToast.
    // Let's configure a custom event check that App.jsx can trigger or we can listen via custom windows dispatcher!
    // This is a neat trick: dispatch custom window events to sync states!
    window.addEventListener('pizza_socket_status_update', handleStatusSocketUpdate);
    return () => {
      window.removeEventListener('pizza_socket_status_update', handleStatusSocketUpdate);
    };
  }, [orderId]);

  // Milestones listing
  const milestones = [
    { key: 'received', title: 'Order Confirmed', icon: <CheckCircle2 className="h-5 w-5" />, desc: 'We have received your order payment' },
    { key: 'kitchen', title: 'In Kitchen', icon: <CookingPot className="h-5 w-5" />, desc: 'Our chef is preparing the dough' },
    { key: 'baking', title: 'Baking', icon: <Flame className="h-5 w-5" />, desc: 'Baking in stone deck wood oven' },
    { key: 'packaging', title: 'Packaging', icon: <Package className="h-5 w-5" />, desc: 'Packing hot in steam-vent boxes' },
    { key: 'shipping', title: 'Out For Delivery', icon: <Truck className="h-5 w-5" />, desc: 'Rider is zooming to your address' },
    { key: 'delivered', title: 'Delivered', icon: <Smile className="h-5 w-5" />, desc: 'Order received. Enjoy your hot slice!' }
  ];

  const getMilestoneIndex = (status) => {
    return milestones.findIndex(m => m.key === status);
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <span className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-sm text-slate-400">Locating tracking satellites...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="glass-panel max-w-md w-full p-8 rounded-2xl border border-white/5 shadow-2xl text-center">
          <CheckCircle2 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold font-heading theme-text-heading">Tracking Offline</h2>
          <p className="text-xs text-slate-400 mt-2">{error || 'Order detail not found'}</p>
          <div className="mt-6">
            <Link to="/dashboard" className="glass-btn px-6 py-3 rounded-xl text-xs">Return to Menu</Link>
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = getMilestoneIndex(order.orderStatus);

  // Animate delivery van position (Framer Motion progress)
  // Van starts at 0% and reaches 100% at 'delivered'
  const progressPercent = (currentIdx / (milestones.length - 1)) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full space-y-8">
      
      {/* Tracker Header details */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Live Tracking</span>
          <h1 className="text-2xl font-extrabold font-heading theme-text-heading mt-1">{order.orderId}</h1>
          <p className="text-slate-400 mt-1">Payment: <span className="text-emerald-400 font-bold uppercase">{order.paymentStatus}</span></p>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex items-center space-x-3.5">
          <Clock className="h-6 w-6 text-orange-500 animate-pulse" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Estimated Delivery</span>
            <div className="font-extrabold text-sm theme-text-heading mt-0.5">
              {new Date(order.estimatedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">40 minutes default delivery</span>
          </div>
        </div>
      </div>

      {/* DELIVERY VAN PROGRESS ANIMATION ROAD */}
      <div className="glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden">
        <h3 className="text-sm font-bold font-heading text-slate-300 mb-6 uppercase tracking-wider">Rider Progress</h3>
        
        {/* Road line */}
        <div className="h-2 w-full bg-slate-900 rounded-full relative overflow-hidden">
          {/* Active progress */}
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Animated Delivery Van Icon */}
        <motion.div 
          className="absolute -top-1 w-8 h-8 text-orange-500 z-10"
          animate={{ left: `calc(${progressPercent}% - 16px)` }}
          transition={{ type: 'spring', stiffness: 40, damping: 10 }}
          style={{ top: '48px' }} // position on the road
        >
          <Truck className="h-7 w-7 text-orange-500 drop-shadow-[0_2px_8px_rgba(255,87,34,0.4)]" />
        </motion.div>

        {/* Road Landmarks */}
        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-6 font-semibold select-none">
          <span className={currentIdx >= 0 ? 'text-orange-400 font-bold' : ''}>🍕 Kitchen</span>
          <span className={currentIdx >= 4 ? 'text-orange-400 font-bold' : ''}>🚴 Out For Delivery</span>
          <span className={currentIdx === 5 ? 'text-emerald-400 font-bold' : ''}>🏠 Home</span>
        </div>
      </div>

      {/* TRACKING TIMELINE STEPS */}
      <div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6">
        <h3 className="text-sm font-bold font-heading text-slate-300 uppercase tracking-wider mb-2">Milestones</h3>
        <div className="relative border-l-2 border-slate-900 ml-4 space-y-8 pl-8">
          
          {milestones.map((milestone, idx) => {
            const isCompleted = idx < currentIdx;
            const isActive = idx === currentIdx;
            const isFuture = idx > currentIdx;

            return (
              <div key={milestone.key} className="relative text-xs">
                {/* Milestone Dot Indicator */}
                <div className={`absolute -left-12 top-0.5 h-7 w-7 rounded-full flex items-center justify-center border transition-all ${
                  isActive ? 'bg-orange-500 border-orange-500 text-white ring-4 ring-orange-500/20 scale-110 animate-pulse' :
                  isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-600'
                }`}>
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : milestone.icon}
                </div>

                {/* Milestone Detail text */}
                <div>
                  <h4 className={`font-bold text-sm ${isActive ? 'text-orange-400 font-extrabold' : isCompleted ? 'theme-text-heading' : 'text-slate-600'}`}>
                    {milestone.title}
                  </h4>
                  <p className={`mt-0.5 ${isActive ? 'text-slate-300' : isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                    {milestone.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Back to dashboard */}
      <div className="text-center pt-4">
        <Link to="/dashboard" className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl font-bold text-xs transition-all inline-flex items-center space-x-1">
          <span>Return to Dashboard</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

    </div>
  );
}
