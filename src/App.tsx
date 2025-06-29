import React, { useState, useEffect, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { Employee } from './types';
import { useAuth } from './hooks/useAuth';
import { checkSupabaseConnection } from './lib/supabase';

// Lazy load components for better performance
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const SignupPage = React.lazy(() => import('./components/SignupPage'));
const AdminSignupPage = React.lazy(() => import('./components/AdminSignupPage'));
const EmployeeDashboard = React.lazy(() => import('./components/EmployeeDashboard'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

type Page = 'landing' | 'login' | 'signup' | 'admin-signup' | 'employee-dashboard' | 'admin-dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const { user, employee, loading, error, signIn, signUp, signOut, clearError } = useAuth();

  // Check database connection on app start
  useEffect(() => {
    const checkConnection = async () => {
      const { connected } = await checkSupabaseConnection();
      setConnectionStatus(connected ? 'connected' : 'error');
    };
    
    checkConnection();
  }, []);

  useEffect(() => {
    // Skip landing page if user is already authenticated
    if (user && employee && !loading) {
      setCurrentPage(employee.role === 'admin' ? 'admin-dashboard' : 'employee-dashboard');
    } else if (!loading && !user) {
      // Only show landing page after loading is complete and no user
      if (currentPage === 'landing') {
        const timer = setTimeout(() => {
          setCurrentPage('login');
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, employee, loading, currentPage]);

  // Clear errors when page changes
  useEffect(() => {
    clearError();
  }, [currentPage, clearError]);

  const handleLandingTransition = () => {
    setCurrentPage('login');
  };

  const handleLogin = async (identifier: string, password: string, role: 'employee' | 'admin') => {
    try {
      const { data, error } = await signIn(identifier, password);
      
      if (error) {
        throw new Error(error.message || 'Login failed');
      }
      
      if (data?.user && employee) {
        // Verify role matches
        if (employee.role !== role) {
          throw new Error('Invalid credentials or incorrect role selection');
        }
        setCurrentPage(employee.role === 'admin' ? 'admin-dashboard' : 'employee-dashboard');
      }
    } catch (err: any) {
      throw new Error(err.message || 'Login failed. Please try again.');
    }
  };

  const handleSignup = () => {
    setCurrentPage('signup');
  };

  const handleAdminSignup = () => {
    setCurrentPage('admin-signup');
  };

  const handleSignupComplete = async (userData: {
    name: string;
    email: string;
    employeeId: string;
    password: string;
    role?: 'employee' | 'admin';
    phone?: string;
    department?: string;
    position?: string;
  }) => {
    try {
      const { data, error } = await signUp(userData.email, userData.password, {
        name: userData.name,
        employeeId: userData.employeeId,
        role: userData.role || 'employee',
        phone: userData.phone,
        department: userData.department,
        position: userData.position
      });

      if (error) {
        throw new Error(error.message || 'Registration failed');
      }

      setCurrentPage('login');
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleBackToLogin = () => {
    setCurrentPage('login');
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentPage('login');
  };

  // Show connection error if database is not accessible
  if (connectionStatus === 'error') {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Database Connection Error
            </h1>
            <p className="text-gray-600 mb-6">
              Unable to connect to the database. Please check your internet connection or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Show loading spinner while checking authentication or connection
  if (loading || connectionStatus === 'checking') {
    return (
      <LoadingSpinner 
        size="xl" 
        text={connectionStatus === 'checking' ? 'Connecting to database...' : 'Loading...'} 
        fullScreen 
      />
    );
  }

  const renderCurrentPage = () => {
    const pageProps = {
      onLogin: handleLogin,
      onSignup: handleSignup,
      onAdminSignup: handleAdminSignup,
      onSignupComplete: handleSignupComplete,
      onBackToLogin: handleBackToLogin,
      onLogout: handleLogout,
      onTransition: handleLandingTransition,
    };

    switch (currentPage) {
      case 'landing':
        return (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading..." fullScreen />}>
            <LandingPage onTransition={pageProps.onTransition} />
          </Suspense>
        );
      case 'login':
        return (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading..." fullScreen />}>
            <LoginPage 
              onLogin={pageProps.onLogin} 
              onSignup={pageProps.onSignup} 
              onAdminSignup={pageProps.onAdminSignup} 
            />
          </Suspense>
        );
      case 'signup':
        return (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading..." fullScreen />}>
            <SignupPage 
              onSignupComplete={pageProps.onSignupComplete} 
              onBackToLogin={pageProps.onBackToLogin} 
            />
          </Suspense>
        );
      case 'admin-signup':
        return (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading..." fullScreen />}>
            <AdminSignupPage 
              onSignupComplete={pageProps.onSignupComplete} 
              onBackToLogin={pageProps.onBackToLogin} 
            />
          </Suspense>
        );
      case 'employee-dashboard':
        return employee ? (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading dashboard..." fullScreen />}>
            <EmployeeDashboard user={employee} onLogout={pageProps.onLogout} />
          </Suspense>
        ) : null;
      case 'admin-dashboard':
        return employee ? (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading dashboard..." fullScreen />}>
            <AdminDashboard user={employee} onLogout={pageProps.onLogout} />
          </Suspense>
        ) : null;
      default:
        return (
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading..." fullScreen />}>
            <LandingPage onTransition={pageProps.onTransition} />
          </Suspense>
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="App">
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <button
                onClick={clearError}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
        {renderCurrentPage()}
      </div>
    </ErrorBoundary>
  );
}

export default App;