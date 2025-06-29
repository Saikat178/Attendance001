import { useState, useEffect, useCallback } from 'react';
import { Employee } from '../types';

export interface AuthState {
  user: any | null;
  employee: Employee | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}

// Mock authentication hook for demo purposes
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    employee: null,
    session: null,
    loading: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const setError = useCallback((error: string) => {
    setAuthState(prev => ({ ...prev, error }));
  }, []);

  // Mock sign up function
  const signUp = async (email: string, password: string, userData: {
    name: string;
    employeeId: string;
    role?: 'employee' | 'admin';
    phone?: string;
    department?: string;
    position?: string;
  }) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock validation
      if (!email || !password || !userData.name || !userData.employeeId) {
        throw new Error('All required fields must be filled');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Mock success response
      const mockUser = {
        id: `user-${Date.now()}`,
        email,
        user_metadata: {
          name: userData.name,
          employee_id: userData.employeeId
        }
      };

      setAuthState(prev => ({ ...prev, loading: false }));
      return { data: { user: mockUser }, error: null };
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Registration failed' 
      }));
      return { data: null, error: { message: error.message } };
    }
  };

  // Mock sign in function
  const signIn = async (identifier: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock validation
      if (!identifier || !password) {
        throw new Error('Email/Employee ID and password are required');
      }

      // Mock success response
      const mockUser = {
        id: `user-${Date.now()}`,
        email: identifier.includes('@') ? identifier : `${identifier}@company.com`,
      };

      setAuthState(prev => ({ ...prev, loading: false }));
      return { data: { user: mockUser }, error: null };
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Login failed' 
      }));
      return { data: null, error: { message: error.message } };
    }
  };

  // Mock sign out function
  const signOut = async () => {
    try {
      setAuthState({
        user: null,
        employee: null,
        session: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      setError(error.message || 'Sign out failed');
    }
  };

  // Mock update profile function
  const updateProfile = async (updates: Partial<Employee>) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAuthState(prev => ({ ...prev, loading: false }));
      return { error: null };
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Profile update failed' 
      }));
      return { error: { message: error.message } };
    }
  };

  const refreshSession = useCallback(async () => {
    return { data: null, error: null };
  }, []);

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshSession,
    clearError,
  };
};