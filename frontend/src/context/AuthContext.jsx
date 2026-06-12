import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const API_URL = 'http://localhost:8000/api/';

// Axios instances
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure request interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tms_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth from localstorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('tms_access_token');
      const savedUser = localStorage.getItem('tms_user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Validate token or fetch profile to ensure it is valid
          const response = await api.get('auth/profile/');
          setUser(response.data);
          localStorage.setItem('tms_user', JSON.stringify(response.data));
        } catch (error) {
          console.error("Auth validation failed, logging out", error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('auth/login/', { email, password });
      const { access, refresh, user: userData } = response.data;
      
      localStorage.setItem('tms_access_token', access);
      localStorage.setItem('tms_refresh_token', refresh);
      localStorage.setItem('tms_user', JSON.stringify(userData));
      
      setUser(userData);
      return userData;
    } catch (error) {
      throw error.response?.data || { detail: 'Network error occurred' };
    }
  };

  const logout = () => {
    localStorage.removeItem('tms_access_token');
    localStorage.removeItem('tms_refresh_token');
    localStorage.removeItem('tms_user');
    setUser(null);
  };

  const updatePasswordState = (isChanged) => {
    if (user) {
      const updatedUser = { ...user, is_password_changed: isChanged };
      setUser(updatedUser);
      localStorage.setItem('tms_user', JSON.stringify(updatedUser));
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await api.post('auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      updatePasswordState(true);
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to change password' };
    }
  };

  // Axios response interceptor to handle token refresh and unauthorized access
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If 401 unauthorized and we have a refresh token, try to refresh the token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem('tms_refresh_token');
          
          if (refreshToken) {
            try {
              const refreshResponse = await axios.post(`${API_URL}auth/token/refresh/`, {
                refresh: refreshToken,
              });
              const { access } = refreshResponse.data;
              localStorage.setItem('tms_access_token', access);
              originalRequest.headers.Authorization = `Bearer ${access}`;
              return api(originalRequest);
            } catch (refreshError) {
              console.error("Token refresh failed", refreshError);
              logout();
            }
          } else {
            logout();
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    changePassword,
    updatePasswordState,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
