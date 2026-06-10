import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateQuantity, removeFromCart, applyCoupon, removeCoupon, clearCart } from '../redux/slices/cartSlice';
import api from '../utils/api';

// Icons
import { Trash2, ShoppingBag, Plus, Minus, Tag, CreditCard, X, MapPin } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux States
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items, subtotal, tax, deliveryCharge, grandTotal, appliedCoupon, discountAmount } = useSelector((state) => state.cart);

  // Local States
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [addressError, setAddressError] = useState('');

  const [loading, setLoading] = useState(false);

  // Simulator Modal States (For mock payment)
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorData, setSimulatorData] = useState(null);

  // Handle Coupon Apply
  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;
    try {
      // Query coupon validity
      const { data } = await api.get(`/products`); // Fetch product to test API connectivity, then mock local verify or simple request
      // We can use a direct coupon verification or check statically for user convenience
      const code = couponCode.toUpperCase();
      if (code === 'PIZZA50') {
        if (subtotal < 299) {
          setCouponError('Minimum order value of ₹299 required for PIZZA50');
          return;
        }
        dispatch(applyCoupon({ code, discountType: 'flat', value: 50 }));
      } else if (code === 'SLICE30') {
        if (subtotal < 499) {
          setCouponError('Minimum order value of ₹499 required for SLICE30');
          return;
        }
        dispatch(applyCoupon({ code, discountType: 'percentage', value: 30 }));
      } else {
        setCouponError('Invalid coupon code');
      }
    } catch (err) {
      setCouponError('Error verifying coupon');
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    setCouponCode('');
  };

  // Payment Checkout Action
  const handleCheckout = async (e) => {
    e.preventDefault();
    setAddressError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!street || !city || !pincode || !phone) {
      setAddressError('Please fill in complete delivery details');
      return;
    }

    if (pincode.length !== 6 || isNaN(pincode)) {
      setAddressError('Pincode must be 6 digits');
      return;
    }

    if (phone.length !== 10 || isNaN(phone)) {
      setAddressError('Phone number must be a 10-digit number');
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        items,
        deliveryAddress: { street, city, pincode, phone },
        couponCode: appliedCoupon?.code || ''
      };

      const { data } = await api.post('/orders/checkout', orderPayload);

      if (data.isMock) {
        // Launch Mock Payment Simulator UI
        setSimulatorData(data);
        setShowSimulator(true);
        setLoading(false);
      } else {
        // Launch standard Razorpay SDK
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: 'Slice & Spark 3D Pizza',
          description: 'Secure Order Checkout',
          order_id: data.orderId,
          handler: async (response) => {
            try {
              const verifyPayload = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                calculatedDetails: data.calculatedDetails,
                isMock: false
              };
              const verifyRes = await api.post('/orders/verify', verifyPayload);
              dispatch(clearCart());
              navigate(`/track-order?id=${verifyRes.data.orderId}`);
            } catch (err) {
              alert('Payment validation failed: ' + (err.response?.data?.message || 'Error'));
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: phone
          },
          theme: { color: '#ff5722' }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
      }

    } catch (err) {
      setAddressError(err.response?.data?.message || 'Error creating payment order');
      setLoading(false);
    }
  };

  // Mock Success Payment Simulator
  const handleSimulateSuccess = async () => {
    setShowSimulator(false);
    setLoading(true);
    try {
      const verifyPayload = {
        razorpay_order_id: simulatorData.orderId,
        razorpay_payment_id: `pay_mock_${Math.random().toString(36).slice(2, 9)}`,
        razorpay_signature: 'mock_payment_signature_verification_success_12345',
        calculatedDetails: simulatorData.calculatedDetails,
        isMock: true
      };
      
      const { data } = await api.post('/orders/verify', verifyPayload);
      dispatch(clearCart());
      navigate(`/track-order?id=${data.orderId}`);
    } catch (err) {
      alert('Mock Payment failed to verify: ' + (err.response?.data?.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="glass-panel max-w-md w-full p-8 rounded-2xl text-center border border-white/5 shadow-2xl">
          <ShoppingBag className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-heading text-slate-200">Your Basket is Empty</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Add items from our catalog or start building customized 3D pizzas.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link to="/dashboard" className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all">Catalog</Link>
            <Link to="/customize" className="glass-btn px-5 py-3 rounded-xl text-xs">3D Builder</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* 1. CART ITEMS LIST */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-2xl font-bold font-heading">Shopping Cart ({items.length} items)</h2>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div 
              key={index}
              className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-100 flex items-center">
                    {item.name}
                    <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400 uppercase">{item.size}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Crust: <span className="text-slate-300 font-semibold">{item.base}</span>, Sauce: <span className="text-slate-300 font-semibold">{item.sauce}</span>, Cheese: <span className="text-slate-300 font-semibold">{item.cheese}</span>
                  </p>
                  {item.veggies.length > 0 && (
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Veggies: {item.veggies.join(', ')}</p>
                  )}
                  {item.meats.length > 0 && (
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Meats: {item.meats.join(', ')}</p>
                  )}
                </div>
              </div>

              {/* Adjust Qty & Price */}
              <div className="flex items-center justify-between sm:justify-end sm:space-x-8 pl-12 sm:pl-0">
                <div className="flex items-center space-x-2 bg-slate-900/60 border border-white/5 rounded-lg p-1.5">
                  <button 
                    disabled={item.quantity <= 1}
                    onClick={() => dispatch(updateQuantity({ index, quantity: item.quantity - 1 }))}
                    className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-bold px-2">{item.quantity}</span>
                  <button 
                    onClick={() => dispatch(updateQuantity({ index, quantity: item.quantity + 1 }))}
                    className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-right">
                  <div className="text-lg font-extrabold text-orange-500 font-heading">₹{item.price}</div>
                  <button 
                    onClick={() => dispatch(removeFromCart(index))}
                    className="text-xs text-slate-500 hover:text-red-500 mt-1 flex items-center space-x-0.5 ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. ORDER DETAILS & ADDRESS SIDEBAR */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold font-heading">Checkout details</h2>
        
        {/* Coupon Center */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 text-xs">
          <label className="block font-bold text-slate-400 uppercase tracking-wider mb-2">Discount Coupon</label>
          {appliedCoupon ? (
            <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl">
              <div>
                <span className="font-bold text-emerald-400 text-xs">{appliedCoupon.code}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Applied successfully (-₹{discountAmount})</span>
              </div>
              <button onClick={handleRemoveCoupon} className="text-slate-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <div className="relative flex-grow">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="glass-input pl-9 pr-3 py-2.5 rounded-lg w-full text-xs"
                  placeholder="SLICE30 or PIZZA50"
                />
              </div>
              <button 
                onClick={handleApplyCoupon}
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-bold transition-all text-xs"
              >
                Apply
              </button>
            </div>
          )}
          {couponError && <p className="text-red-400 text-[10px] mt-1.5">{couponError}</p>}
          <div className="mt-2 text-[10px] text-slate-500">Try coupon code <span className="font-semibold text-slate-400">PIZZA50</span> (₹50 off on ₹299+) or <span className="font-semibold text-slate-400">SLICE30</span> (30% off on ₹499+).</div>
        </div>

        {/* Checkout Forms & Address */}
        <form onSubmit={handleCheckout} className="glass-panel p-6 rounded-2xl border border-white/5 space-y-5 text-xs">
          <h3 className="text-sm font-bold font-heading text-slate-100 flex items-center space-x-1">
            <MapPin className="h-4 w-4 text-orange-500" />
            <span>Delivery Address</span>
          </h3>

          {addressError && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px]">
              {addressError}
            </div>
          )}

          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Street Address</label>
            <input
              type="text"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="glass-input w-full px-3 py-2.5 rounded-lg"
              placeholder="Flat no., Street details"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="glass-input w-full px-3 py-2.5 rounded-lg"
                placeholder="Mumbai"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Pincode</label>
              <input
                type="text"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="glass-input w-full px-3 py-2.5 rounded-lg"
                placeholder="400001"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Contact Phone</label>
            <input
              type="text"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="glass-input w-full px-3 py-2.5 rounded-lg"
              placeholder="10-digit number"
            />
          </div>

          {/* Pricing Totals */}
          <div className="pt-4 border-t border-white/5 space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span>₹{subtotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Discount:</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Tax (5% GST):</span>
              <span>₹{tax}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Delivery Charge:</span>
              <span>{deliveryCharge > 0 ? `₹${deliveryCharge}` : 'Free'}</span>
            </div>
            <div className="flex justify-between font-heading font-extrabold text-base pt-2 border-t border-white/5 text-slate-200">
              <span>Grand Total:</span>
              <span className="text-orange-500">₹{grandTotal}</span>
            </div>
          </div>

          {/* Place Order */}
          <button
            type="submit"
            disabled={loading}
            className="glass-btn w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                <span>Place Order & Pay</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 3. SIMULATED MOCK PAYMENT CHECKOUT MODAL */}
      {showSimulator && simulatorData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-2xl space-y-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-100">Razorpay Payment Simulator</h3>
              <p className="text-xs text-slate-400 mt-1">Simulating test mode checkout gate</p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-semibold text-slate-300">{simulatorData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Due:</span>
                <span className="font-bold text-orange-500">₹{simulatorData.calculatedDetails.grandTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Prefill Name:</span>
                <span className="text-slate-300">{user?.name}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowSimulator(false)}
                className="py-3 rounded-xl border border-white/5 bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all"
              >
                Decline Payment
              </button>
              <button
                onClick={handleSimulateSuccess}
                className="py-3 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-all"
              >
                Approve Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
