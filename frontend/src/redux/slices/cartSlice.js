import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], // { name, isCustom, size, base, sauce, cheese, veggies, meats, quantity, price }
  subtotal: 0,
  tax: 0,
  deliveryCharge: 0,
  grandTotal: 0,
  appliedCoupon: null, // { code, discountType, value }
  discountAmount: 0
};

const recalculateTotals = (state) => {
  // 1. Subtotal
  state.subtotal = state.items.reduce((sum, item) => sum + item.price, 0);

  // 2. Coupon Discount
  state.discountAmount = 0;
  if (state.appliedCoupon) {
    const { discountType, value } = state.appliedCoupon;
    if (discountType === 'percentage') {
      state.discountAmount = Math.round((state.subtotal * value) / 100);
    } else {
      state.discountAmount = value;
    }
    // Cap discount
    state.discountAmount = Math.min(state.discountAmount, state.subtotal);
  }

  // 3. Tax & Delivery
  const taxableAmount = Math.max(0, state.subtotal - state.discountAmount);
  state.tax = Math.round(taxableAmount * 0.05); // 5% GST
  state.deliveryCharge = taxableAmount > 500 || taxableAmount === 0 ? 0 : 50;

  // 4. Grand Total
  state.grandTotal = taxableAmount + state.tax + state.deliveryCharge;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload;
      
      // Match duplicate check: check if it's the exact same item recipe
      const existingItemIndex = state.items.findIndex(item => {
        if (item.name !== newItem.name) return false;
        if (item.size !== newItem.size) return false;
        if (item.base !== newItem.base) return false;
        if (item.sauce !== newItem.sauce) return false;
        if (item.cheese !== newItem.cheese) return false;
        
        // Compare arrays
        if (item.veggies.length !== newItem.veggies.length) return false;
        if (item.meats.length !== newItem.meats.length) return false;
        
        const vMatch = item.veggies.every(v => newItem.veggies.includes(v));
        const mMatch = item.meats.every(m => newItem.meats.includes(m));
        
        return vMatch && mMatch;
      });

      if (existingItemIndex > -1) {
        state.items[existingItemIndex].quantity += newItem.quantity;
        // recalculate price based on unit price
        const unitPrice = state.items[existingItemIndex].price / (state.items[existingItemIndex].quantity - newItem.quantity);
        state.items[existingItemIndex].price = unitPrice * state.items[existingItemIndex].quantity;
      } else {
        state.items.push(newItem);
      }

      recalculateTotals(state);
    },
    updateQuantity: (state, action) => {
      const { index, quantity } = action.payload;
      if (state.items[index]) {
        const unitPrice = state.items[index].price / state.items[index].quantity;
        state.items[index].quantity = quantity;
        state.items[index].price = unitPrice * quantity;
        recalculateTotals(state);
      }
    },
    removeFromCart: (state, action) => {
      state.items.splice(action.payload, 1);
      recalculateTotals(state);
    },
    applyCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
      recalculateTotals(state);
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null;
      state.discountAmount = 0;
      recalculateTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.tax = 0;
      state.deliveryCharge = 0;
      state.grandTotal = 0;
      state.appliedCoupon = null;
      state.discountAmount = 0;
    }
  }
});

export const { addToCart, updateQuantity, removeFromCart, applyCoupon, removeCoupon, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
