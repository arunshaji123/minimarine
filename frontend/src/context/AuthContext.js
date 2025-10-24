import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Chat system removed: socket imports not needed

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios baseURL when API URL is provided
  useEffect(() => {
    if (process.env.REACT_APP_API_URL) {
      axios.defaults.baseURL = process.env.REACT_APP_API_URL;
    } else {
      // Use relative URLs to leverage proxy
      axios.defaults.baseURL = '/api';
    }
  }, []);
  
  // Helper to detect mock mode (only when explicitly disabled)
  const isMockMode = process.env.REACT_APP_MOCK_MODE === 'true';
  
  // Define fetchUserProfile function first
  const fetchUserProfile = async () => {
    try {
      console.log('AuthContext: fetchUserProfile called, isMockMode:', isMockMode);
      // Use mock user only if mock mode is enabled
      if (isMockMode) {
        const mockUserStr = localStorage.getItem('mockUser');
        if (mockUserStr) {
          const mockUser = JSON.parse(mockUserStr);
          console.log('AuthContext: Using mock user:', mockUser);
          setUser(mockUser);
          setLoading(false);
          return;
        }
      }
      
      // Real API call
      console.log('AuthContext: Making API call to /api/auth/profile with baseURL:', axios.defaults.baseURL);
      const response = await axios.get('/api/auth/profile');
      console.log('AuthContext: Profile response:', response.data);
      setUser(response.data.user);
      setLoading(false);
    } catch (error) {
      console.error('AuthContext: Error fetching user profile:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('mockUser');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
  };
  
  // Create default mock user data only in mock mode
  useEffect(() => {
    if (isMockMode) {
      if (!localStorage.getItem('mockUsers')) {
        const defaultUsers = [
          { id: 1, name: 'Owner User', email: 'owner@example.com', password: 'password', role: 'owner' },
          { id: 2, name: 'Admin User', email: 'admin@example.com', password: 'password', role: 'admin' },
          { id: 3, name: 'Ship Management User', email: 'ship@example.com', password: 'password', role: 'ship_management' },
          { id: 4, name: 'Surveyor User', email: 'surveyor@example.com', password: 'password', role: 'surveyor' }
        ];
        localStorage.setItem('mockUsers', JSON.stringify(defaultUsers));
      }
    }
  }, [isMockMode]);

  // Set up axios defaults and load profile
  useEffect(() => {
    const load = () => {
      console.log('AuthContext: Loading user profile...');
      const token = localStorage.getItem('token');
      console.log('AuthContext: Token found:', !!token);
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        fetchUserProfile();
      } else {
        console.log('AuthContext: No token found, setting loading to false');
        setLoading(false);
      }
    };

    load();

    // Also react to token updates from FirebaseAuthContext
    const onTokenUpdate = () => {
      console.log('AuthContext: Received auth-token-updated event');
      load();
    };
    window.addEventListener('auth-token-updated', onTokenUpdate);
    return () => window.removeEventListener('auth-token-updated', onTokenUpdate);
  }, []);

  const login = async (email, password) => {
    try {
      if (isMockMode) {
        const mockUsersStr = localStorage.getItem('mockUsers');
        if (mockUsersStr) {
          const mockUsers = JSON.parse(mockUsersStr);
          const user = mockUsers.find(u => u.email === email && u.password === password);
          if (user) {
            const mockToken = 'mock-jwt-token-' + Math.random().toString(36).substring(2);
            localStorage.setItem('token', mockToken);
            localStorage.setItem('mockUser', JSON.stringify(user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
            setUser(user);
            return { success: true, message: 'Login successful', user };
          } else {
            return { success: false, message: 'Invalid email or password' };
          }
        }
      }
      
      // Real API call
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        return { success: true, message: response.data.message, user };
      }
      return { success: false, message: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      if (isMockMode) {
        const mockUserStr = localStorage.getItem('mockUsers');
        let mockUsers = mockUserStr ? JSON.parse(mockUserStr) : [];
        if (mockUsers.some(u => u.email === email)) {
          return { success: false, message: 'Email already in use' };
        }
        const newUser = { id: mockUsers.length + 1, name, email, password, role: role || 'owner' };
        mockUsers.push(newUser);
        localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
        
        // Don't set token or user - require explicit login
        return { success: true, message: 'Registration successful', user: newUser };
      }
      
      // Real API call
      const response = await axios.post('/api/auth/register', { name, email, password, role });
      if (response.data.success) {
        // Don't set token or user - require explicit login
        return { success: true, message: response.data.message || 'Registration successful', user: response.data.user };
      }
      return { success: false, message: 'Registration failed' };
    } catch (apiError) {
      const message = apiError.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('mockUser');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = { user, login, register, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};