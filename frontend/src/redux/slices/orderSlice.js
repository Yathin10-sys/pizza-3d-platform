import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userOrders: [],
  adminOrders: [],
  currentTracking: null,
  loading: false,
  error: null
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    orderStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchUserOrdersSuccess: (state, action) => {
      state.userOrders = action.payload;
      state.loading = false;
    },
    fetchAdminOrdersSuccess: (state, action) => {
      state.adminOrders = action.payload;
      state.loading = false;
    },
    fetchTrackingSuccess: (state, action) => {
      state.currentTracking = action.payload;
      state.loading = false;
    },
    orderFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateTrackingStatus: (state, action) => {
      const { orderId, status, estimatedTime } = action.payload;
      if (state.currentTracking && state.currentTracking.orderId === orderId) {
        state.currentTracking.orderStatus = status;
        if (estimatedTime) {
          state.currentTracking.estimatedDeliveryTime = estimatedTime;
        }
      }
      // Update in user list too
      const uIdx = state.userOrders.findIndex(o => o.orderId === orderId);
      if (uIdx > -1) {
        state.userOrders[uIdx].orderStatus = status;
      }
      // Update in admin list too
      const aIdx = state.adminOrders.findIndex(o => o.orderId === orderId);
      if (aIdx > -1) {
        state.adminOrders[aIdx].orderStatus = status;
      }
    },
    addNewAdminOrder: (state, action) => {
      // Add to beginning of queue
      state.adminOrders.unshift(action.payload);
    }
  }
});

export const {
  orderStart,
  fetchUserOrdersSuccess,
  fetchAdminOrdersSuccess,
  fetchTrackingSuccess,
  orderFailure,
  updateTrackingStatus,
  addNewAdminOrder
} = orderSlice.actions;

export default orderSlice.reducer;
