import { createSlice } from '@reduxjs/toolkit';

const getInitialState = () => {
  const user = localStorage.getItem('pizza_user');
  const accessToken = localStorage.getItem('pizza_access_token');
  const refreshToken = localStorage.getItem('pizza_refresh_token');
  
  return {
    user: user ? JSON.parse(user) : null,
    accessToken: accessToken || null,
    refreshToken: refreshToken || null,
    isAuthenticated: !!accessToken,
    loading: false,
    error: null,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.loading = false;
      
      // Store in localStorage
      localStorage.setItem('pizza_user', JSON.stringify(user));
      localStorage.setItem('pizza_access_token', accessToken);
      localStorage.setItem('pizza_refresh_token', refreshToken);
    },
    authFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateTokens: (state, action) => {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      localStorage.setItem('pizza_access_token', accessToken);
      localStorage.setItem('pizza_refresh_token', refreshToken);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;

      localStorage.removeItem('pizza_user');
      localStorage.removeItem('pizza_access_token');
      localStorage.removeItem('pizza_refresh_token');
    }
  }
});

export const { authStart, authSuccess, authFailure, updateTokens, logout } = authSlice.actions;
export default authSlice.reducer;
