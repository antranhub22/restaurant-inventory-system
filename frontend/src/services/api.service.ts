// API Base URL
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000';

// API Response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// API Error class
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Check if token is expired
const isTokenExpired = (): boolean => {
  const token = getAuthToken();
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Refresh token
const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.token;
    }
  } catch (error) {
    console.error('Failed to refresh token:', error);
  }
  
  return null;
};

// API request function
const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Add auth header if token exists
  const token = getAuthToken();
  if (token && !isTokenExpired()) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle token refresh if 401
    if (response.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        // Retry with new token
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        };
        const retryResponse = await fetch(url, options);
        if (retryResponse.ok) {
          return await retryResponse.json();
        }
      }
      
      // If refresh failed, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new ApiError('Unauthorized', 401);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData.code
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
};

// API methods
export const apiService = {
  // GET request
  get: <T = any>(endpoint: string): Promise<T> => {
    return apiRequest<T>(endpoint, { method: 'GET' });
  },

  // POST request
  post: <T = any>(endpoint: string, data?: any): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PUT request
  put: <T = any>(endpoint: string, data?: any): Promise<T> => {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // DELETE request
  delete: <T = any>(endpoint: string): Promise<T> => {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
  },

  // File upload
  upload: <T = any>(endpoint: string, formData: FormData): Promise<T> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    
    if (token && !isTokenExpired()) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP ${response.status}: ${response.statusText}` 
        }));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status
        );
      }
      return response.json();
    });
  },

  // Auth methods
  login: async (email: string, password: string) => {
    const response = await apiRequest<ApiResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.data) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    
    return response;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = getAuthToken();
    return token !== null && !isTokenExpired();
  },
};

export { ApiError };
export type { ApiResponse }; 