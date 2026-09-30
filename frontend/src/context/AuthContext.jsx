import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('medicare_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem('medicare_access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/profile/');
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('medicare_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const handleAuthChange = () => {
      const saved = localStorage.getItem('medicare_user');
      setUser(saved ? JSON.parse(saved) : null);
    };

    window.addEventListener('medicare_auth_change', handleAuthChange);
    return () => window.removeEventListener('medicare_auth_change', handleAuthChange);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password });
    const { user: userData, tokens } = res.data;
    localStorage.setItem('medicare_access_token', tokens.access_token);
    localStorage.setItem('medicare_refresh_token', tokens.refresh_token);
    localStorage.setItem('medicare_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register/', formData);
    const { user: userData, tokens } = res.data;
    localStorage.setItem('medicare_access_token', tokens.access_token);
    localStorage.setItem('medicare_refresh_token', tokens.refresh_token);
    localStorage.setItem('medicare_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('medicare_access_token');
    localStorage.removeItem('medicare_refresh_token');
    localStorage.removeItem('medicare_user');
    setUser(null);
  };

  const updateProfile = async (updates) => {
    const res = await api.put('/auth/profile/', updates);
    if (res.data?.user) {
      setUser(res.data.user);
      localStorage.setItem('medicare_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const isAdmin = user?.role === 'ADMIN';
  const isPharmacist = user?.role === 'PHARMACIST' || user?.role === 'ADMIN';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        isPharmacist,
        login,
        register,
        logout,
        updateProfile,
        refreshUser: fetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
