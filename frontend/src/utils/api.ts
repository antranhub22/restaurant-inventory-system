import axios from 'axios';
import { useAuthStore } from '../store';

const API_URL = import.meta.env.VITE_API_URL || 'https://restaurant-inventory-system.onrender.com/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor để thêm token và validate
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    
    if (token) {
      // Check if token is expired before making request (with 5 minute buffer)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
        if (payload.exp * 1000 < (Date.now() + bufferTime)) {
          console.warn('Token will expire soon, but allowing request to proceed');
          // Don't logout immediately, let the backend handle it
        }
        
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.warn('Invalid token format, logging out');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(new Error('Invalid token'));
      }
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor để handle errors với retry mechanism
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle different error scenarios
    if (error.response?.status === 401) {
      // Token expired hoặc invalid
      console.warn('401 Unauthorized - but letting component handle it');
      // Don't auto-logout for OCR operations, let the calling component decide
      // useAuthStore.getState().logout();
      // window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden - insufficient permissions
      console.warn('403 Forbidden - insufficient permissions');
      // Could show a permission denied modal instead of redirecting
    } else if (error.response?.status >= 500) {
      // Server error - could implement retry logic here
      console.error('Server error:', error.response?.status, error.response?.data);
      
      // Simple retry mechanism for server errors (max 1 retry)
      if (!originalRequest._retry && originalRequest.method?.toLowerCase() === 'get') {
        originalRequest._retry = true;
        console.log('Retrying request due to server error...');
        return api(originalRequest);
      }
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      console.error('Request timeout');
    } else if (!error.response) {
      // Network error
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Utility function to check API health
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// Utility function to make authenticated requests
export const makeAuthenticatedRequest = async (config: any) => {
  const { token } = useAuthStore.getState();
  
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  return api({
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};

export default api;