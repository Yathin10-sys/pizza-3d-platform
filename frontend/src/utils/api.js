import axios from 'axios';
import { store } from '../redux/store';
import { updateTokens, logout } from '../redux/slices/authSlice';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests to add JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pizza_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle 401 Token Expiration and Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('pizza_refresh_token');

      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh-token', { refreshToken });
          
          // Save tokens in state and storage
          store.dispatch(updateTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken
          }));

          // Re-send original request
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh token fails, logout user
          store.dispatch(logout());
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
