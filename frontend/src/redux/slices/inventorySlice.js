import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  ingredients: {
    base: [],
    sauce: [],
    cheese: [],
    veggie: [],
    meat: []
  },
  adminItems: [], // Flatted list for table CRUD
  loading: false,
  error: null
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    fetchStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchSuccessGrouped: (state, action) => {
      state.ingredients = action.payload;
      state.loading = false;
    },
    fetchSuccessAdmin: (state, action) => {
      state.adminItems = action.payload;
      state.loading = false;
    },
    fetchFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateAdminItem: (state, action) => {
      const idx = state.adminItems.findIndex(item => item._id === action.payload._id);
      if (idx > -1) {
        state.adminItems[idx] = action.payload;
      }
    },
    deleteAdminItem: (state, action) => {
      state.adminItems = state.adminItems.filter(item => item._id !== action.payload);
    }
  }
});

export const {
  fetchStart,
  fetchSuccessGrouped,
  fetchSuccessAdmin,
  fetchFailure,
  updateAdminItem,
  deleteAdminItem
} = inventorySlice.actions;

export default inventorySlice.reducer;
